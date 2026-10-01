from django.db import models
import uuid
from apps.organizations.models import Organization, Site
from apps.packages.models import PackagePlan

class Voucher(models.Model):
    STATUS_CHOICES = (
        ('ACTIVE', 'Active'),
        ('USED', 'Used'),
        ('EXPIRED', 'Expired'),
        ('DISABLED', 'Disabled'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='vouchers')
    site = models.ForeignKey(Site, on_delete=models.SET_NULL, null=True, blank=True, related_name='vouchers')
    package = models.ForeignKey(PackagePlan, on_delete=models.CASCADE, related_name='vouchers')
    code = models.CharField(max_length=64, unique=True)
    pin = models.CharField(max_length=32, blank=True)
    price = models.DecimalField(max_digits=12, decimal_places=2) # TZS
    duration_minutes = models.IntegerField()
    download_speed_kbps = models.IntegerField()
    upload_speed_kbps = models.IntegerField()
    data_limit_mb = models.BigIntegerField(default=0)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='ACTIVE')
    batch_id = models.CharField(max_length=64, blank=True)
    used_by_mac = models.CharField(max_length=32, blank=True)
    used_by_phone = models.CharField(max_length=32, blank=True)
    used_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'xcloud_vouchers'
        indexes = [
            models.Index(fields=['organization', 'status']),
            models.Index(fields=['code']),
            models.Index(fields=['expires_at']),
        ]

    def __str__(self):
        return f"{self.code} ({self.status})"
