.PHONY: build run logs help

# Build the Docker image
build:
	@echo "Building IE-app Docker image..."
	docker build -t ie-app .

# Run the container locally
run:
	@echo "Starting IE-app container on http://localhost:8080"
	@echo "Routes available:"
	@echo "  - http://localhost:8080/ (Next.js frontend)"
	@echo "  - http://localhost:8080/admin (Django admin)"
	@echo "  - http://localhost:8080/api (Django API)"
	@echo "  - http://localhost:8080/healthz (Health check)"
	docker run --rm -p 8080:80 \
		-e DEBUG=True \
		-e DJANGO_ALLOW_ALL_HOSTS=1 \
		ie-app

# Show instructions for viewing EB logs
logs:
	@echo "To view Elastic Beanstalk logs:"
	@echo ""
	@echo "1. SSH into your EB instance:"
	@echo "   eb ssh"
	@echo ""
	@echo "2. View application logs:"
	@echo "   sudo tail -f /var/log/eb-docker/containers/eb-current-app/*.log"
	@echo ""
	@echo "3. View nginx logs:"
	@echo "   sudo tail -f /var/log/nginx/access.log"
	@echo "   sudo tail -f /var/log/nginx/error.log"
	@echo ""
	@echo "4. View Docker logs:"
	@echo "   sudo docker logs \$$(sudo docker ps -q)"
	@echo ""
	@echo "5. View supervisord logs inside container:"
	@echo "   sudo docker exec -it \$$(sudo docker ps -q) supervisorctl tail -f django"
	@echo "   sudo docker exec -it \$$(sudo docker ps -q) supervisorctl tail -f next"
	@echo "   sudo docker exec -it \$$(sudo docker ps -q) supervisorctl tail -f nginx"

# Show help
help:
	@echo "Available targets:"
	@echo "  build  - Build the Docker image"
	@echo "  run    - Run the container locally on port 8080"
	@echo "  logs   - Show instructions for viewing EB logs"
	@echo "  help   - Show this help message"
