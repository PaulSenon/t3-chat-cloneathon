SHELL := /bin/bash
COMPOSE_PROJECT_NAME = t3-chat-clone
DOCKER_COMPOSE_FILE = ./docker/docker-compose.dev.yml
COMPOSE = docker compose --file $(DOCKER_COMPOSE_FILE) --project-name $(COMPOSE_PROJECT_NAME)

# Smart container execution - runs in existing container or starts new one
define run_in_container_smart
	@if [ $$( $(COMPOSE) ps --status running --services | grep -c app) -gt 0 ]; then \
		echo "attaching to running container..."; \
		$(COMPOSE) exec $(1) $(2); \
	else \
		echo "starting container and running command..."; \
		$(COMPOSE) run --rm --service-ports $(1) $(2) && \
		$(MAKE) stop; \
	fi
endef

# REQUIRED COMMANDS (must be implemented in every project)
install: ## Install everything needed for development
	$(MAKE) docker-build
	$(call run_in_container_smart,app,bash -c "pnpm install && pnpm dlx convex dev")

dev: ## Start development server
	$(call run_in_container_smart,app,bash -c "pnpm dlx convex dev & pnpm run dev")

bash: ## Access container shell
	$(call run_in_container_smart,app,bash)

run: ## Run arbitrary command in container (for LLM agents)
	$(call run_in_container_smart,app,$(cmd))

clean: ## Clean everything (containers, volumes, dependencies)
	$(COMPOSE) down --rmi all --volumes --remove-orphans
	rm -rf .next .vercel node_modules

stop: ## Stop all containers
	$(COMPOSE) down --remove-orphans

# UTILITY COMMANDS
docker-build: ## Build development image
	$(COMPOSE) build

docker-build-force: ## Force rebuild image
	$(COMPOSE) build --no-cache

create-env-files: ## Create required environment files
	@if [ ! -f .env.local ]; then \
		echo "# LOCAL SECRETS - NEVER COMMIT" > .env.local; \
	fi

# CONVEX COMMANDS
convex-login: ## Login to Convex cloud
	$(call run_in_container_smart,convex,pnpm dlx convex login)

convex-logout: ## Logout from Convex cloud
	$(call run_in_container_smart,convex,pnpm dlx convex logout)

convex-dev: ## Start Convex development server
	$(call run_in_container_smart,convex,pnpm dlx convex dev)

convex-deploy: ## Deploy Convex functions to production
	$(call run_in_container_smart,convex,pnpm dlx convex deploy --prod)

help: ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' 