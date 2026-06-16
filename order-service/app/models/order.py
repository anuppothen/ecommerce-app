from sqlalchemy import Column, Integer, String, DECIMAL, Text, Enum, TIMESTAMP, ForeignKey, func
from sqlalchemy.orm import relationship
from app.config.database import Base
import enum

# -- Order Status Enum ---------------------------
# Python's equivalent of the MySQL ENUM column
class OrderStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"

# -- Order Model ---------------------------------
# Maps to the `orders` table
class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    status = Column(Enum(OrderStatus), default=OrderStatus.pending)
    total_amount = Column(DECIMAL(10, 2), nullable=False)
    shipping_address = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationship - lets us access order.items to get all items for this order
    # "cascade" means if an order is deleted, its items are deleted too (matches our DB foreign key)
    items = relationship("OrderItems", back_populates="order", cascade="all, delete-orphan")

# -- Order Items Model ----------------------------
# Maps to the 'order items' table
class OrderItems(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, nullable=False)
    product_name = Column(String(200), nullable=False)
    price = Column(DECIMAL(10, 2), nullable=False)
    quantity = Column(Integer, nullable=False)
    subtotal = Column(DECIMAL(10, 2), nullable=False)

    # Relationship = lets us access items.order to get the parent order
    order = relationship("Order", back_populates="items")