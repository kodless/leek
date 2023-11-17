import logging
from typing import Union
import pymsteams

import requests

from leek.api.db.store import Task, Worker, STATES_SUCCESS, STATES_EXCEPTION, STATES_UNREADY
from leek.api.conf import settings

logger = logging.getLogger(__name__)


def get_color(state):
    if state in STATES_EXCEPTION:
        return "f44336"
    elif state in STATES_SUCCESS:
        return "66cc99"
    elif state in STATES_UNREADY:
        return "36C5F0"
    else:
        return "f1c232"


def send_teams(app_name: str, event: Union[Task, Worker], wh_url: str, extra: dict):
    teams_message = pymsteams.connectorcard(wh_url)

    teams_message.title(f"Task: {event.name}")
    teams_message.color(get_color(event.state))
    teams_message.addLinkButton("View task", f"{settings.LEEK_WEB_URL}/task?app={app_name}&uuid={event.uuid}")

    section = pymsteams.cardsection()
    section.addFact("Application", app_name)
    section.addFact("Environment", event.app_env)
    section.addFact("Task worker", event.worker)
    section.addFact("Task state", event.state)
    section.addFact("Task uuid", event.uuid)

    if extra.get("note"):
        section.addFact("Note", extra.get("note"))

    teams_message.addSection(section)
    teams_message.send()
