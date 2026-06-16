from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
import httpx
import os

from app.config.database import get_db
from app.config.logger import logger
from app.models.order import Order, OrderItems, OrderStatus
from app.schemas.order import (
    CreateOrderRequest,
    UpdateOrderStatusRequest,
    OrderResponse,
    OrderListResponse,
)
from app.dependencies.auth import get_current_user, admin_only

router = APIRouter()

CART_SERVICE_URL = os.getenv("CART_SERVICE_URL")
PRODUCT_SERVICE_URL = os.getenv("PRODUCT_SERVICE_URL")

# -- Helper Functions -----------------------------
async def get_user_cart(user_id: int, token: str):
    """
    Fetches the current user's cart from the Cart service.
    Passes through the user's JWT token for authentication.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{CART_SERVICE_URL}/api/cart",
                headers={"Authorization": f"Bearer {token}"}
            )
            response.raise_for_status()
            return response.json()["cart"]
    except httpx.HTTPError as e:
        logger.error(f"Failed to fetch cart for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cart service unavailable"
        )
    
async def clear_user_cart(token: str):
    """
    Clears the user's cart after an order is successfully placed.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{CART_SERVICE_URL}/api/cart",
                headers={"Authorization": f"Bearer {token}"}
            )
            response.raise_for_status()
    except httpx.HTTPError as e:
        # Log but don't fail the order - the order was already created successfully
        logger.error(f"Failed to clear cart: {str(e)}")

async def verify_product_stock(product_id: int, quantity: int):
    """
    Checks the Product Service to confirm a product still has enough stock.
    Returns the product details if available
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{PRODUCT_SERVICE_URL}/api/products/{product_id}")

        if response.status_code == 404:
            return None
        
        response.raise_for_status()
        product = response.json()["product"]

        if product["stock"] < quantity:
            return {"insufficient stock": True, "available": product["stock"], "product": product}
        
        return {"insufficient stock": False, "product": product}
    except httpx.HTTPError as e:
        logger.error(f"Product service unavailable: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Product service unavailable"
        )

# -- Routes --------------------------------------
@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: CreateOrderRequest,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
    authorization: str = Depends(lambda authorization=None: authorization)
):
    """
    Creates a new order from the user's current cart.
    
    Steps:
    1. Fetch the user's cart from the Cart Service.
    2. Verify each item still has sufficient stock.
    3. Create the order and the order items in the database.
    4. Clear the user's cart.
    """
    user_id = user["id"]
    token = authorization.split(" ")[1] if authorization else None

    logger.info(f"User {user_id} creating order")

    # 1. Fetch the cart
    cart = await get_user_cart(user_id, token)

    if not cart["items"]:
        logger.warning(f"Order creation failed - cart is empty for user {user_id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot place an order with an empty cart"
        )
    
    # 2. Verify stock for each item
    for item in cart["items"]:
        stock_check = await verify_product_stock(item["productId"], item["quantity"])
        if stock_check is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {item['productId']} no longer exists"
            )
        
        if stock_check["Insufficient_stock"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for {item['name']} - only {stock_check['available']} left"
            )
        
    # 3. Create the order
    new_order = Order(
        user_id=user_id,
        status=OrderStatus.pending,
        total_amount=cart["total"],
        shipping_address=order_data.shipping_address,
    )
    db.add(new_order)
    db.flush() # Generates new_order.id without committing yet

    # Create order items from cart items
    for item in cart["items"]:
        order_item = OrderItem(
            order_id=new_order.id,
            product_id=item["productId"],
            product_name=item["name"],
            price=item["price"],
            quantity=item["quantity"],
            subtotal=round(item["price"] * item["quantity"], 2),
        )
        db.add(order_item)
    
    db.commit()
    db.refresh(new_order)

    logger.info(f"Order {new_order.id} created for user {user_id} - total: ${new_order.total_amount}")

    # 4. Clear the cart
    await clear_user_cart(token)
    return new_order

@router.get("/", response_model=OrderListResponse)
async def get_my_orders(
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the order history for the logged-in user, most recent first.
    """
    user_id=user["id"]
    logger.info(f"Fetching orders for user {user_id}")

    orders = db.query(Order).filter(Order.user_id == user_id).order_by(desc(Order.created_at)).all()

    logger.info(f"Found {len(orders)} orders for user {user_id}")
    return {"count": len(orders), "orders": orders}

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns a single order. Users can only view their own orders
    unless they're an admin.
    """
    logger.info(f"User {user['id']} fetching order {order_id}")

    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        logger.warning(f"Order {order_id} not found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Users can only see their own orders, admins can see any order
    if order.user_id != user["id"] and user.get("role") != "admin":
        logger.warning(f"User {user['id']} attempted to access order {order_id} belonging to another user")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    logger.info(f"Order {order_id} retrieved")
    return order

@router.put("/{order_id}", response_model=OrderResponse)
async def update_order_status(
    order_id: int,
    status_data: UpdateOrderStatusRequest,
    user: dict = Depends(admin_only),
    db: Session = Depends(get_db)
):
    """
    Updates an order's status. Admin only.
    e.g. pending -> confirmed -> shipped -> delivered
    """
    logger.info(f"Admin {user['id']} updating order {order_id} to status {status_data.status}")

    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        logger.warning(f"Update failed - order {order_id} not found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    order.status = status_data.status
    db.commit()
    db.refresh(order)

    logger.info(f"Order {order_id} status updated to {status_data.status}")
    return order