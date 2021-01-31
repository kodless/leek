from leek_demo.app import app


@app.task
def child_task():
    return "I'm a child"
