# SquirrelTable

todo...

## Getting Started

### SSH & SQL Settings

Copy `.env.sample` to `.env` and fill in your SSH and MySQL/MariaDB login information.

#### Example

```
# .env
SSH_host=example.com
SSH_user=ssh_username
SSH_privatekey=path/to/ssh/private.key
SQL_user=sql_username
SQL_pass=sql_password
SQL_host=127.0.0.1
SQL_db=sql_database_name
```

### SQL Files

Copy any and all `.sql` files to `sql/`. These files will be available to run in the app. Any commented lines will display in the app under "Comments:"

