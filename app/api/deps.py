import uuid
from fastapi import Header
from app.models.enums import UserRole


def get_current_faskes_id(
    x_faskes_id: int | None = Header(
        default=None,
        description="ID Faskes tenant (diisi untuk isolasi data RS/Puskesmas, kosongkan untuk Super Admin Dinkes)",
    ),
) -> int | None:
    return x_faskes_id


def get_current_user_role(
    x_user_role: UserRole | None = Header(
        default=None,
        description="Role pengguna untuk simulasi akses (SUPER_ADMIN_DINKES, ADMIN_FASKES, BIDAN_JAGA)",
    ),
    x_faskes_id: int | None = Header(default=None),
) -> UserRole:
    if x_user_role:
        return x_user_role
    if x_faskes_id is None:
        return UserRole.SUPER_ADMIN_DINKES
    return UserRole.BIDAN_JAGA


def get_current_user_id(
    x_user_id: uuid.UUID | None = Header(
        default=None,
        description="UUID user bidan pelaksana (opsional untuk audit trail)",
    ),
) -> uuid.UUID | None:
    return x_user_id
