def split_fqn(fqn: str):
    """
    Given a fully qualified function name like:
        'myproject.app.tasks.process_data'
    return a tuple:
        ('myproject.app.tasks', 'process_data')
    """
    if '.' not in fqn:
        # No module path, just a function name
        return {
            "module": "",
            "function": fqn
        }

    parts = fqn.rsplit('.', 1)
    module_name = parts[0]
    function_name = parts[1]
    return {
        "module": module_name,
        "function": function_name
    }
