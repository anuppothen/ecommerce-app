from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from app.models.order import OrderStatus

# -- Request Schemas (what the client sends us) ---------------------

class CreateOrderRequest(BaseModel):
    """
    What the client sends when placing an order.
    The cart contents are fetched server-side, 
    but we need a shipping address from the users
    """
    shipping_address: str = Field(
        ..., # ... means this field is required
        min_length=10,
        max_length=500,
        description="Full delivery address"
    )

    # Example shown in the auto-generated API docs
    class Config:
        json_schema_extra = {
            "example": {
                "shipping_address": "123 Main Street, Sydney NSW 2000, Australia"
            }
        }

class UpdateOrderStatusRequest(BaseModel):
    """
    What an admin sends to update an order's status
    """
    status: OrderStatus

    class Config:
        json_schema_extras = {
            "example": {
                "status": "confirmed"
            }
        }

# -- Response Schemas (what we send back to the client) --------------
class OrderItemResponse(BaseModel):
    """
    Represents a single item within an order in API responses.
    """
    id: int
    product_id: int
    product_name: str
    price: Decimal
    quantity: int
    subtotal: Decimal

    # Allows Pydantic to read data directly from SQLAlchemy model objects
    # (not just dictionaries)

    class Config:
        from_attributes = True
    
class OrderResponse(BaseModel):
    """
    Represents the full order in API responses, including all its items.
    """
    id: int
    user_id: int
    status: OrderStatus
    total_amount: Decimal
    shipping_address: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True

class OrderListResponse(BaseModel):
    """
    Used when returning a list of orders, e.g. order history
    """
    count: int
    orders: List[OrderResponse]

# -- Internal Schemas (used between functions) --------------------------
class CartItem(BaseModel):
    """
    Represents a single item as it comes from the Cart Service.
    Used internally when building an order from a cart
    """
    productId: int
    name: str
    price: float
    quantity: int
    imageUrl: Optional[str] = None

class CartResponse(BaseModel):
    """
    Represents the full cart response from the Cart Service
    """
    items: List[CartItem]
    total: float