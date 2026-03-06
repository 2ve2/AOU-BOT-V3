# AOU-BOT-V3

A comprehensive Telegram bot for Arab Open University (AOU) students, providing various academic services and information.

## 📋 Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Bot](#running-the-bot)
- [Project Structure](#project-structure)
- [Available Commands](#available-commands)
- [Services](#services)
- [Database](#database)
- [Contributing](#contributing)

## ✨ Features

- **User Management**: User authentication and profile management
- **Academic Resources**: Access to books, slides, and study materials
- **Course Information**: View courses, prices, and study plans
- **Events & Calendar**: Academic events and calendar management
- **FAQ System**: Frequently asked questions and answers
- **Groups & Channels**: Academic groups and channel management
- **Calculator**: Academic calculator for GPA and grades
- **Broadcast**: Send announcements to users
- **Multi-language Support**: Language switching capabilities
- **Statistics**: Track user engagement and bot usage
- **Backup Service**: Automated data backup

## 🚀 Installation

### Prerequisites

- [Bun](https://bun.sh) v1.3.8 or higher
- Node.js (optional, for compatibility)
- SQLite database

### Steps

1. Clone the repository:
```bash
git clone <repository-url>
cd AOU-BOT-V3
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables (see [Configuration](#configuration))

4. Run database migrations:
```bash
bun run db:push
```

## ⚙️ Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Telegram Bot Configuration
BOT_TOKEN=your_telegram_bot_token_here

# Database Configuration
DATABASE_URL=file:./data/miftahdb.db

# Admin Configuration
ADMIN_IDS=comma_separated_admin_user_ids

# Other Configuration
NODE_ENV=development
```

## 🏃 Running the Bot

### Development Mode

```bash
bun run dev
```

### Production Mode

```bash
bun run start
```

### Using TypeScript Directly

```bash
bun run index.ts
```

## 📁 Project Structure

```
AOU-BOT-V3/
├── src/
│   ├── app.ts                 # Main application entry point
│   ├── bot/
│   │   ├── bot.ts            # Bot initialization and setup
│   │   ├── commands/         # Bot command handlers
│   │   │   ├── admin.ts      # Admin commands
│   │   │   ├── help.ts       # Help command
│   │   │   ├── lang.ts       # Language switching
│   │   │   ├── me.ts         # User profile
│   │   │   └── start.ts      # Start command
│   │   ├── callbacks/        # Callback query handlers
│   │   ├── handlers/         # Feature-specific handlers
│   │   │   ├── booksHandler.ts
│   │   │   ├── broadcastHandler.ts
│   │   │   ├── calculatorHandler.ts
│   │   │   ├── calendarsHandler.ts
│   │   │   ├── channelHandler.ts
│   │   │   ├── coursesHandler.ts
│   │   │   ├── emailHandlers.ts
│   │   │   ├── eventsHandler.ts
│   │   │   ├── faqHandler.ts
│   │   │   ├── groupsHandler.ts
│   │   │   ├── keyboard.ts
│   │   │   ├── slidesHandler.ts
│   │   │   └── studyPlansHandler.ts
│   │   ├── inline/           # Inline query handlers
│   │   ├── messages/         # Message handlers
│   │   ├── middlewares/      # Bot middlewares
│   │   │   └── auth.ts       # Authentication middleware
│   │   ├── schedulers/      # Scheduled tasks
│   │   │   └── eventScheduler.ts
│   │   └── services/         # Business logic services
│   │       ├── backupService.ts
│   │       ├── bookService.ts
│   │       ├── branchService.ts
│   │       ├── calculatorService.ts
│   │       ├── calendarService.ts
│   │       ├── courseService.ts
│   │       ├── eventService.ts
│   │       ├── faqService.ts
│   │       ├── groupService.ts
│   │       ├── planService.ts
│   │       ├── slideService.ts
│   │       ├── statisticsService.ts
│   │       └── userService.ts
│   ├── config/
│   │   └── env.ts            # Environment configuration
│   ├── data/                 # Static data files
│   │   ├── branches.json
│   │   ├── calendars.json
│   │   ├── coursePrices.json
│   │   ├── courses.json
│   │   ├── faqs.json
│   │   ├── groups.json
│   │   ├── materials.json
│   │   └── plans.json
│   ├── db/
│   │   ├── index.ts          # Database connection
│   │   ├── migrations/       # Database migrations
│   │   └── schema/           # Database schemas
│   │       ├── auth.ts
│   │       ├── book.ts
│   │       └── slide.ts
│   ├── lib/
│   │   ├── cacheService.ts  # Caching layer
│   │   ├── miftahdbService.ts
│   │   └── transaction.ts    # Transaction handling
│   ├── types/
│   │   └── schemas.ts       # TypeScript type definitions
│   └── utils/
│       └── logger.ts         # Logging utility
├── data/                     # Database files
│   ├── miftahdb.db
│   ├── miftahdb.db-shm
│   └── miftahdb.db-wal
├── drizzle.config.ts         # Drizzle ORM configuration
├── package.json
├── tsconfig.json
└── bun.lock
```

## 🤖 Available Commands

### User Commands

- `/start` - Initialize the bot and get started
- `/help` - Display help information and available commands
- `/me` - View your user profile
- `/lang` - Change the bot language

### Admin Commands

- Admin-specific commands for managing the bot (requires admin privileges)

## 🔧 Services

### Core Services

- **UserService**: Manages user data and authentication
- **BookService**: Handles book-related operations
- **SlideService**: Manages slide materials
- **CourseService**: Provides course information
- **EventService**: Manages academic events
- **FAQService**: Handles frequently asked questions
- **GroupService**: Manages academic groups
- **CalendarService**: Provides calendar information
- **CalculatorService**: Academic calculations
- **PlanService**: Study plan management
- **BranchService**: Branch information
- **StatisticsService**: Usage statistics
- **BackupService**: Data backup operations

### Supporting Services

- **CacheService**: Caching layer for performance
- **MiftahDBService**: Database service wrapper
- **TransactionService**: Database transaction management

## 🗄️ Database

The bot uses SQLite with Drizzle ORM for data persistence.

### Database Schema

- **Users**: User authentication and profile data
- **Books**: Book information and metadata
- **Slides**: Slide materials and references
- **Auth**: Authentication tokens and sessions

### Migrations

Database migrations are managed using Drizzle ORM. To create new migrations:

```bash
bun run db:generate
```

To apply migrations:

```bash
bun run db:push
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions, please contact the development team or open an issue in the repository.

---

**Built with ❤️ using Bun and TypeScript**