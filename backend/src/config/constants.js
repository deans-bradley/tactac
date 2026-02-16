export const ROLES = {
  ADMIN: 'admin',
  USER: 'user'
};

export const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL: false
};

export const POST_LIMITS = {
  MAX_CAPTION_LENGTH: 500,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
};

export const COMMENT_LIMITS = {
  MAX_LENGTH: 1000
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
};

export const TRENDING = {
  TIME_WINDOW_HOURS: 168, // 7 days
  MIN_LIKES_FOR_TRENDING: 1
};

export const ACCOUNT_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DEACTIVATED: 'deactivated'
};
