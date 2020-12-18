from typing import List
import re

from .slack import send_slack


def notify(app, env, events: List[dict]):
    fo_triggers = app.get("fo_triggers", [])
    if not len(fo_triggers):
        return
    for trigger in fo_triggers:
        envs = trigger.get("envs", [])
        # Skip: Trigger not enabled
        if not trigger.get("enabled"):
            continue
        # Skip: Env not matched
        if len(envs) and env not in envs:
            continue

        states = trigger.get("states", [])
        exclusions = trigger.get("exclude", [])
        inclusions = trigger.get("include", [])
        runtime_upper_bound = trigger.get("runtime_upper_bound", 0)
        for event in events:
            note = None
            state = event.get("state")
            # Skip: event is not related to task
            if event.get("kind") != 'task':
                continue
            # Skip: State not matched
            if len(states) and state not in states:
                continue
            # Skip: task excluded
            if len(exclusions) and any(re.match(exclusion, event.get("name")) for exclusion in exclusions):
                continue
            # Skip: task not included
            elif len(inclusions) and any(re.match(inclusion, event.get("name")) for inclusion in inclusions):
                continue
            if state == "SUCCEEDED" and runtime_upper_bound:
                # Skip: task runtime did not exceed runtime upper bound
                if event.get("runtime", 0) <= runtime_upper_bound:
                    continue
                else:
                    note = f"Runtime upper bound exceeded: `{event.get('runtime', 0)} seconds`"
            # Finally: notify
            if trigger.get("type") == "slack":
                send_slack(app["app_name"], env, event, trigger.get("slack_wh_url"),
                           extra={"note": note})
