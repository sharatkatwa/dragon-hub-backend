const swaggerJsdoc = require("swagger-jsdoc");

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "DevHub API",
      version: "1.0.0",
      description: "API documentation for DevHub",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "Something went wrong",
            },
          },
        },
        User: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              example: "665abc1234567890abcdef12",
            },
            username: {
              type: "string",
              example: "john",
            },
            fullName: {
              type: "string",
              example: "John Doe",
            },
            bio: {
              type: "string",
              example: "Full stack developer",
            },
            avatar: {
              type: "string",
              example: "https://ik.imagekit.io/demo/avatar.jpg",
            },
            banner: {
              type: "string",
              example: "https://ik.imagekit.io/demo/banner.jpg",
            },
            skills: {
              type: "array",
              items: {
                type: "string",
              },
              example: ["React", "Node.js", "MongoDB"],
            },
            socialLinks: {
              type: "object",
            },
          },
        },
        Project: {
          type: "object",
          properties: {
            _id: {
              type: "string",
            },
            title: {
              type: "string",
              example: "DevHub",
            },
            description: {
              type: "string",
              example: "A developer social platform",
            },
            techStack: {
              type: "array",
              items: {
                type: "string",
              },
              example: ["React", "Node.js"],
            },
            githubUrl: {
              type: "string",
              example: "https://github.com/user/devhub",
            },
            liveUrl: {
              type: "string",
              example: "https://devhub.example.com",
            },
            image: {
              type: "string",
            },
            tags: {
              type: "array",
              items: {
                type: "string",
              },
            },
            owner: {
              $ref: "#/components/schemas/User",
            },
            likes: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },
        },
        Blog: {
          type: "object",
          properties: {
            _id: {
              type: "string",
            },
            title: {
              type: "string",
              example: "How to Build an Express API",
            },
            slug: {
              type: "string",
              example: "how-to-build-an-express-api",
            },
            content: {
              type: "string",
              example: "# Hello DevHub",
            },
            excerpt: {
              type: "string",
            },
            coverImage: {
              type: "string",
            },
            tags: {
              type: "array",
              items: {
                type: "string",
              },
            },
            category: {
              type: "string",
              example: "backend",
            },
            author: {
              $ref: "#/components/schemas/User",
            },
            likes: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
});

module.exports = swaggerSpec;
