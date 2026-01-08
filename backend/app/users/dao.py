from app.core.dao import BaseDAO
from app.users.models import UserModel
from app.users.schemas import UserCreateDB, UserUpdateDB


class UserDAO(BaseDAO[UserModel, UserCreateDB, UserUpdateDB]):
    model = UserModel