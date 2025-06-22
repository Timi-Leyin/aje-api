import { mysqlTable, mysqlSchema, AnyMySqlColumn, primaryKey, unique, varchar, text, timestamp, mysqlEnum, float, int, datetime, tinyint } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const advertisement = mysqlTable("advertisement", {
	id: varchar({ length: 100 }).notNull(),
	title: text(),
	description: text(),
	cta: text(),
	ctaLink: text("cta_link"),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "advertisement_id"}),
	unique("users_id_unique").on(table.id),
]);

export const docsVerification = mysqlTable("docs_verification", {
	id: varchar({ length: 100 }).notNull(),
	userId: text("user_id"),
	note: text(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "docs_verification_id"}),
	unique("users_id_unique").on(table.id),
]);

export const files = mysqlTable("files", {
	id: varchar({ length: 100 }).notNull(),
	src: text().notNull(),
	name: varchar({ length: 100 }),
	fileProvider: mysqlEnum("file_provider", ['cloudinary','self_hosted']),
	propertyId: text("property_id"),
	userId: text("user_id"),
	productId: text("product_id"),
	galleryId: text("gallery_id"),
	ninDocId: text("nin_doc_id"),
	cacDocId: text("cac_doc_id"),
	advertisementId: text("advertisement_id"),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "files_id"}),
	unique("users_id_unique").on(table.id),
]);

export const gallery = mysqlTable("gallery", {
	id: varchar({ length: 100 }).notNull(),
	userId: text("user_id"),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "gallery_id"}),
	unique("users_id_unique").on(table.id),
]);

export const notification = mysqlTable("notification", {
	id: varchar({ length: 100 }).notNull(),
	title: text(),
	message: text(),
	type: varchar({ length: 50 }),
	read: tinyint().default(0),
	userId: text("user_id"),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "notification_id"}),
	unique("users_id_unique").on(table.id),
]);

export const product = mysqlTable("product", {
	id: varchar({ length: 100 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	price: float().notNull(),
	currency: mysqlEnum(['USD','NGN']),
	lat: float(),
	lon: float(),
	city: varchar({ length: 100 }),
	address: varchar({ length: 255 }),
	type: varchar({ length: 50 }).notNull(),
	userId: text("user_id"),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "product_id"}),
	unique("users_id_unique").on(table.id),
]);

export const property = mysqlTable("property", {
	id: varchar({ length: 100 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	price: float().notNull(),
	currency: mysqlEnum(['USD','NGN']),
	amenities: text().default(sql`('')`),
	lat: float(),
	lon: float(),
	city: varchar({ length: 100 }),
	youtubeLink: varchar("youtube_link", { length: 150 }),
	address: varchar({ length: 255 }),
	listingType: varchar({ length: 25 }).notNull(),
	type: varchar({ length: 50 }).notNull(),
	bathrooms: int().default(0),
	beds: int().default(0),
	bedrooms: int().default(0),
	propertyId: text("property_id"),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "property_id"}),
	unique("users_id_unique").on(table.id),
]);

export const report = mysqlTable("report", {
	id: varchar({ length: 100 }).notNull(),
	category: text().notNull(),
	details: text(),
	propertyId: text("property_id"),
	productId: text("product_id"),
	artisanId: text("artisan_id"),
},
(table) => [
	primaryKey({ columns: [table.id], name: "report_id"}),
	unique("users_id_unique").on(table.id),
]);

export const review = mysqlTable("review", {
	id: varchar({ length: 100 }).notNull(),
	rating: int().default(0),
	message: text(),
	propertyId: text("property_id"),
	productId: text("product_id"),
	userId: text("user_id"),
	artisanId: text("artisan_id"),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "review_id"}),
	unique("users_id_unique").on(table.id),
]);

export const schedule = mysqlTable("schedule", {
	id: varchar({ length: 100 }).notNull(),
	propertyId: text("property_id"),
	weekday: varchar({ length: 25 }),
	from: timestamp({ mode: 'string' }),
	to: timestamp({ mode: 'string' }),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "schedule_id"}),
	unique("users_id_unique").on(table.id),
]);

export const subscription = mysqlTable("subscription", {
	id: varchar({ length: 100 }).notNull(),
	userId: text("user_id"),
	transactionId: text("transaction_id"),
	planName: text("plan_name"),
	planCode: text("plan_code").notNull(),
	code: text(),
	active: tinyint(),
	expired: tinyint(),
	cancelled: tinyint(),
	nextPaymentAt: datetime("next_payment_at", { mode: 'string'}),
	transactionStatus: mysqlEnum("transaction_status", ['pending','failed','success']).default('pending'),
	paidAt: datetime("paid_at", { mode: 'string'}),
	amount: float(),
	reties: int(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "subscription_id"}),
	unique("users_id_unique").on(table.id),
]);

export const transaction = mysqlTable("transaction", {
	id: varchar({ length: 100 }).notNull(),
	userId: text("user_id"),
	subscriptionId: text("subscription_id"),
	planCode: text("plan_code").notNull(),
	transactionStatus: mysqlEnum("transaction_status", ['pending','failed','success']).default('pending'),
	amount: float(),
	fee: float(),
	paidAt: datetime("paid_at", { mode: 'string'}),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "transaction_id"}),
	unique("users_id_unique").on(table.id),
]);

export const users = mysqlTable("users", {
	id: varchar({ length: 100 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	firstName: varchar("first_name", { length: 50 }).notNull(),
	lastName: varchar("last_name", { length: 50 }).notNull(),
	phone: varchar({ length: 15 }).notNull(),
	verified: tinyint().default(0),
	verificationStatus: mysqlEnum("verification_status", ['pending','verified','rejected']),
	password: text(),
	authProvider: mysqlEnum("auth_provider", ['google','default']).default('default'),
	userTypes: mysqlEnum("user_types", ['buyer','agent','vendor','artisan','admin']).default('buyer'),
	bio: text(),
	services: text(),
	address: text(),
	city: varchar({ length: 30 }),
	available: tinyint(),
	subscriptionId: text("subscription_id"),
	lastLogin: timestamp("last_login", { mode: 'string' }).default(sql`(now())`),
	fcmToken: text("fcm_token"),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "users_id"}),
	unique("users_id_unique").on(table.id),
	unique("users_email_unique").on(table.email),
]);
