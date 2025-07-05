.PHONY: help build build-prod up up-prod down restart restart-prod logs clean clean-all test test-ci shell shell-prod web db redis nginx migrate makemigrations createsuperuser loaddata dumpdata format lint typecheck security-check check-dependencies update-dependencies install-hooks pre-commit test-coverage test-html

# Colors
GREEN  := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
WHITE  := $(shell tput -Txterm setaf 7)
RESET  := $(shell tput -Txterm sgr0)

# Default target
help:
	@echo '\n${YELLOW}Development:${RESET}'
	@echo '  ${GREEN}build${RESET}            Build or rebuild development services'
	@echo '  ${GREEN}up${RESET}              Start all services in detached mode (development)'
	@echo '  ${GREEN}down${RESET}            Stop and remove containers, networks (development)'
	@echo '  ${GREEN}restart${RESET}         Restart all services (development)'
	@echo '  ${GREEN}logs${RESET}            View output from containers'
	@echo '  ${GREEN}clean${RESET}           Remove all unused containers, networks, images and volumes'
	@echo '  ${GREEN}shell${RESET}           Open a shell in the web container (development)'
	@echo '  ${GREEN}web${RESET}             Run a command in the web container'
	@echo '  ${GREEN}db${RESET}              Connect to the database'
	@echo '  ${GREEN}redis${RESET}           Connect to Redis'
	@echo '  ${GREEN}nginx${RESET}           View Nginx logs'
	@echo '  ${GREEN}migrate${RESET}         Run database migrations'
	@echo '  ${GREEN}makemigrations${RESET}  Create new database migrations'
	@echo '  ${GREEN}createsuperuser${RESET} Create a superuser'
	@echo '  ${GREEN}loaddata${RESET}        Load fixture data'
	@echo '  ${GREEN}dumpdata${RESET}        Dump data to fixtures'
	@echo '\n${YELLOW}Testing:${RESET}'
	@echo '  ${GREEN}test${RESET}            Run tests with coverage'
	@echo '  ${GREEN}test-ci${RESET}         Run tests for CI environment'
	@echo '  ${GREEN}test-coverage${RESET}   Run tests with coverage report'
	@echo '  ${GREEN}test-html${RESET}       Generate HTML coverage report'
	@echo '\n${YELLOW}Code Quality:${RESET}'
	@echo '  ${GREEN}format${RESET}          Format code with Black and isort'
	@echo '  ${GREEN}lint${RESET}            Run linters (flake8, pylint, etc.)'
	@echo '  ${GREEN}typecheck${RESET}       Run static type checking with mypy'
	@echo '  ${GREEN}security-check${RESET}  Run security checks with bandit and safety'
	@echo '  ${GREEN}check-dependencies${RESET} Check for outdated dependencies'
	@echo '  ${GREEN}update-dependencies${RESET} Update Python dependencies'
	@echo '  ${GREEN}install-hooks${RESET}   Install git hooks'
	@echo '  ${GREEN}pre-commit${RESET}      Run pre-commit on all files'
	@echo '\n${YELLOW}Production:${RESET}'
	@echo '  ${GREEN}build-prod${RESET}      Build production services'
	@echo '  ${GREEN}up-prod${RESET}        Start production services'
	@echo '  ${GREEN}restart-prod${RESET}   Restart production services'
	@echo '  ${GREEN}shell-prod${RESET}     Open a shell in the production web container'

# Development Commands
build:
	@echo "${GREEN}Building development services...${RESET}"
	docker-compose -f docker-compose.yml -f docker-compose.override.yml build

up:
	@echo "${GREEN}Starting development services...${RESET}"
	docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d

down:
	@echo "${YELLOW}Stopping development services...${RESET}"
	docker-compose -f docker-compose.yml -f docker-compose.override.yml down

restart: down up

logs:
	docker-compose -f docker-compose.yml -f docker-compose.override.yml logs -f

clean:
	@echo "${YELLOW}Cleaning up...${RESET}"
	docker-compose -f docker-compose.yml -f docker-compose.override.yml down -v --remove-orphans
	docker system prune -f
	sudo rm -rf postgres_data redis_data static_volume media_volume

shell:
	docker-compose -f docker-compose.yml -f docker-compose.override.yml exec web bash

web:
	docker-compose -f docker-compose.yml -f docker-compose.override.yml exec web $(cmd)

db:
	@docker-compose -f docker-compose.yml -f docker-compose.override.yml exec db psql -U $$(grep POSTGRES_USER .env | cut -d '=' -f2) -d $$(grep POSTGRES_DB .env | cut -d '=' -f2)

redis:
	@docker-compose -f docker-compose.yml -f docker-compose.override.yml exec redis redis-cli -a $$(grep REDIS_PASSWORD .env | cut -d '=' -f2)

nginx:
	docker-compose -f docker-compose.yml -f docker-compose.override.yml logs -f nginx

migrate:
	docker-compose -f docker-compose.yml -f docker-compose.override.yml exec web python manage.py migrate

makemigrations:
	docker-compose -f docker-compose.yml -f docker-compose.override.yml exec web python manage.py makemigrations

createsuperuser:
	docker-compose -f docker-compose.yml -f docker-compose.override.yml exec web python manage.py createsuperuser

loaddata:
	docker-compose -f docker-compose.yml -f docker-compose.override.yml exec web python manage.py loaddata $(fixture)

dumpdata:
	@mkdir -p fixtures
	docker-compose -f docker-compose.yml -f docker-compose.override.yml exec web python manage.py dumpdata --indent 2 $(app) > fixtures/$(app).json

# Production Commands
build-prod:
	@echo "${GREEN}Building production services...${RESET}"
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

up-prod:
	@echo "${GREEN}Starting production services...${RESET}"
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

restart-prod:
	@echo "${YELLOW}Restarting production services...${RESET}"
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart

shell-prod:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec web sh

# Testing Commands
test:
	docker-compose -f docker-compose.ci.yml run --rm test

test-ci:
	docker-compose -f docker-compose.ci.yml run --rm test

test-coverage:
	docker-compose -f docker-compose.ci.yml run --rm test pytest --cov=. --cov-report=term-missing

test-html:
	docker-compose -f docker-compose.ci.yml run --rm test pytest --cov=. --cov-report=html
	@echo "${GREEN}Coverage report generated at htmlcov/index.html${RESET}"

# Code Quality Commands
format:
	docker-compose -f docker-compose.yml -f docker-compose.override.yml exec web black .
	docker-compose -f docker-compose.yml -f docker-compose.override.yml exec web isort .

lint:
	docker-compose -f docker-compose.yml -f docker-compose.override.yml exec web flake8 .
	docker-compose -f docker-compose.yml -f docker-compose.override.yml exec web pylint --load-plugins pylint_django floreria_cristina/ apps/

typecheck:
	docker-compose -f docker-compose.yml -f docker-compose.override.yml exec web mypy .

security-check:
	docker-compose -f docker-compose.yml -f docker-compose.override.yml exec web bandit -r .
	docker-compose -f docker-compose.yml -f docker-compose.override.yml exec web safety check --full-report

check-dependencies:
	docker-compose -f docker-compose.yml -f docker-compose.override.yml exec web pip list --outdated

update-dependencies:
	docker-compose -f docker-compose.yml -f docker-compose.override.yml exec web pip list --outdated
	@echo "${YELLOW}Update dependencies in requirements.txt and rebuild containers${RESET}"

# Git Hooks
install-hooks:
	@echo "${GREEN}Installing git hooks...${RESET}"
	pre-commit install

pre-commit:
	pre-commit run --all-files
