from django.db import models
import uuid
from apps.organizations.models import Organization, Site

class PaymentTransaction(models.Model):
    GATEWAY_CHOICES = (
        ('MPESA', 'Vodacom M-Pesa'),
        ('AIRTEL', 'Airtel Money'),
        ('TIGO', 'Tigo Pesa'),
        ('SELCOM', 'Selcom Pay'),
        ('CASH', 'Agent Cash POS'),
    )

    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
        ('CANCELLED', 'Cancelled'),
        ('REFUNDED', 'Refunded'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='payments')
    site = models.ForeignKey(Site, on_delete=models.SET_NULL, null=True, blank=True, related_name='payments')
    gateway = models.CharField(max_length=32, choices=GATEWAY_CHOICES)
    gateway_reference = models.CharField(max_length=128, blank=True)
    transaction_reference = models.CharField(max_length=128, unique=True)
    phone = models.CharField(max_length=32)
    amount = models.DecimalField(max_digits=12, decimal_places=2) # TZS
    currency = models.CharField(max_length=8, default='TZS')
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='PENDING')
    idempotency_key = models.CharField(max_length=128, unique=True)
    raw_payload = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'xcloud_payments'
        indexes = [
            models.Index(fields=['organization', 'status']),
            models.Index(fields=['transaction_reference']),
            models.Index(fields=['idempotency_key']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.transaction_reference} - {self.gateway} - TZS {self.amount} ({self.status})"
