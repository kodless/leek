from leek_test.app import app


@app.task
def child():
    return "I'm a child"
