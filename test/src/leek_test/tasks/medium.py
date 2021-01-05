from leek_test.app import app


@app.task
def child_task():
    return "I'm a child"
