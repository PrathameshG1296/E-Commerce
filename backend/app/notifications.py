import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Placeholder for a real email service configuration (e.g., SendGrid, AWS SES, SMTP)
# For now, it logs the email payload so we can verify it's working.

async def send_order_confirmation_email(user_email: str, order_id: str, total_amount: float):
    """
    Send an order confirmation email to the user.
    """
    subject = f"Order Confirmation: #{order_id[:8].upper()}"
    body = f"Thank you for your order! Your payment of ₹{total_amount} has been received. Your order ID is {order_id}."
    
    # TODO: Integrate real email sending logic here
    logger.info(f"📧 [EMAIL SENT] To: {user_email} | Subject: {subject} | Body: {body}")
    print(f"\n📧 [EMAIL SENT]\nTo: {user_email}\nSubject: {subject}\nBody: {body}\n")


async def send_order_status_update_email(user_email: str, order_id: str, new_status: str):
    """
    Send an order status update email to the user.
    """
    subject = f"Order Status Update: #{order_id[:8].upper()}"
    body = f"Your order #{order_id[:8].upper()} status has been updated to: {new_status.upper()}."
    
    # TODO: Integrate real email sending logic here
    logger.info(f"📧 [EMAIL SENT] To: {user_email} | Subject: {subject} | Body: {body}")
    print(f"\n📧 [EMAIL SENT]\nTo: {user_email}\nSubject: {subject}\nBody: {body}\n")

