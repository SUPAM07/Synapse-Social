# Database Schema Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              auth.users                                 │
│  (Clerk-managed via InsForge)                                           │
│  ─────────                                                              │
│  id (uuid) PK                                                           │
│  email, etc. (managed by Clerk)                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
           ┌────────────────────────┼────────────────────────┐
           │                        │                        │
           ▼                        ▼                        ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  channel_types  │      │  user_channels  │      │   idea_groups   │
│  ─────────────  │      │  ─────────────  │      │  ─────────────  │
│  id (uuid) PK   │◄─────│  id (uuid) PK   │      │  id (uuid) PK   │
│  type           │      │  user_id FK     │      │  name           │
│  name           │      │  channel_type_id│      │  created_at     │
│  color          │      │  handle         │      │                 │
│          │      │         profile_image  │      │  [SEED TABLE]   │
│ character_limit │      │  access_token   │      │  Unassigned     │
│  created_at     │      │  is_connected   │      │  To Do          │
│  [SEED TABLE]   │      │  is_active      │      │  In Progress    │
│                 │      │  created_at     │      │  Done           │
│                 │      │  updated_at     │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
                                                              │
                                                              ▼
┌─────────────────┐      ┌─────────────────────────────────────────┐
│ scheduled_posts │      │                 ideas                   │
│  ─────────────  │      │              ─────────────              │
│  id (uuid) PK   │      │  id (uuid) PK                           │
│  user_id FK     │      │  user_id FK                             │
│ user_channel_id │      │  group_id FK                            │
│  content        │      │  title                                  │
│  images[]       │      │  description                            │
│  scheduled_at   │      │  images[]                               │
│  timezone       │      │  tags[]                                 │
│  status         │      │  sort_order                             │
│  published_at   │      │  created_at                             │
│  published_url  │      │  updated_at                             │
│  created_at     │      └─────────────────────────────────────────┘
│  updated_at     │
└─────────────────┘
                                    │
                                    │ 
                                    ▼
                         ┌─────────────────────────┐
                         │      subscriptions      │
                         │      ─────────────      │
                         │           │
                         └─────────────────────────┘
```