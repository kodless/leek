help:
	@echo "container commands:"
	@echo "    make run_gunicorn:   Runs flask app in gunicorn config"

	@echo "docker-compose commands:"
	@echo "    make build:          Build docker images"
	@echo "    make up:             Run containers"
	@echo "    make upd:            Run containers in the background"
	@echo "    make shell:          Run shell in app's container"
	@echo "    make flask-shell:    Run flask shell in application context"
	@echo "    make test:           Run tests"
	@echo "    make down:           Stops containers and removes containers created by up"
	@echo "    make routes:         List flask routes"

build:
	docker-compose build


upd:
	docker-compose up -d


up:
	docker-compose up


api:
	docker-compose run --service-ports app


command:
	docker-compose run --rm app python manage.py ${command}


shell:
	docker-compose run --rm app bash


flask-shell:
	docker-compose run --rm app python manage.py shell


test:
	docker-compose run --rm app pytest -v


down:
	docker-compose down


routes:
	docker-compose run --rm app flask routes


prune:
	docker stop $(docker ps -a -q); docker rm $(docker ps -a -q); docker system prune


run_gunicorn:
	gunicorn --reload -c src/app/runtime/container/gunicorn.py "src.app.runtime.container.wsgi:app"
