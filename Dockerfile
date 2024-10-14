# Use an official Node.js image as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the container
COPY . .

# Expose the port that the app will run on
EXPOSE ${SERVER_PORT}

# Define environment variables (can be overridden by docker-compose)
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]
