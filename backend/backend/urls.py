from django.urls import path
from game.views import create_room

urlpatterns = [
    path("api/create-room/", create_room),
]
