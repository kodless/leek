import logging
from typing import Union

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

    body = {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        "themeColor": get_color(event.state),
        "summary": f"Task: {event.name}",
        "sections": [{
            "activityTitle": f"Task: {event.name}",
            "activitySubtitle": f"Application: {app_name}",
            "activityImage": "https://raw.githubusercontent.com/kodless/leek/master/doc/static/img/logo.png",
            "facts": [{
                "name": "Environment",
                "value": event.app_env
            }, {
                "name": "Task worker",
                "value": event.worker
            }, {
                "name": "Task state",
                "value": event.state
            }, {
                "name": "Task uuid",
                "value": event.uuid
            }],
            "markdown": True
        }],
        "potentialAction": [{
            "@type": "OpenUri",
            "name": "View task",
            "targets": [{
                "os": "default",
                "uri": f"{settings.LEEK_WEB_URL}/task?app={app_name}&uuid={event.uuid}"
            }]
        }]
    }

    if extra.get("note"):
        body["sections"][0]["facts"].append({
            "name": "Note",
            "value": extra.get("note")
        })

    try:
        requests.post(
            wh_url,
            headers={"Accept": "application/json", "Content-Type": "application/json"},
            json=body
        ).raise_for_status()
    except Exception as e:
        logger.error(f"Request to teams returned an error: {e}")

