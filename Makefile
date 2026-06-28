.DEFAULT_GOAL := help
.PHONY: help up down restart fresh seed simulate alerts demo ui logs ps shell horizon

help: ## List available targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

up: ## Build and start the whole stack (detached)
	spin up -d --build

down: ## Stop and remove containers
	spin down

restart: down up ## Restart the stack

fresh: ## Drop, re-migrate and re-seed the database (wipes recorded jobs)
	spin exec -T php php artisan migrate:fresh --seed --force

seed: ## Seed the demo user
	spin exec -T php php artisan db:seed --force

simulate: ## Dispatch demo queue traffic (override count: make simulate JOBS=500)
	spin exec -T php php artisan argus-demo:simulate --jobs=$(or $(JOBS),240)

alerts: ## Run the alert evaluator once (checks all rules and fires any that breach)
	spin exec -T php php artisan argus:evaluate-alerts

demo: ## Seed, simulate traffic, and evaluate alerts in one shot
	$(MAKE) seed
	$(MAKE) simulate
	$(MAKE) alerts

ui: ## Rebuild the Argus SPA into public/argus
	spin run -T node npm ci
	spin run -T node npm run build

logs: ## Follow logs for all services
	spin logs -f

ps: ## Show container status
	spin ps

shell: ## Open a shell in the php container
	spin exec php sh

horizon: ## Show Horizon status
	spin exec -T php php artisan horizon:status
