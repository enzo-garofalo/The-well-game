"""
HTTP views — only one endpoint: POST /api/create-room/
"""
import json
import random
import string

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from game.state import ROOMS, RoomState


def _generate_code() -> str:
    chars = string.ascii_uppercase + string.digits
    while True:
        code = "WLG-" + "".join(random.choices(chars, k=3))
        if code not in ROOMS:
            return code


@csrf_exempt
@require_http_methods(["POST", "OPTIONS"])
def create_room(request):
    if request.method == "OPTIONS":
        response = JsonResponse({})
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type"
        return response

    code = _generate_code()
    ROOMS[code] = RoomState(room_code=code)
    response = JsonResponse({"room_code": code})
    response["Access-Control-Allow-Origin"] = "*"
    return response
