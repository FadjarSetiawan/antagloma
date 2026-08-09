-- Antagloma production database upgrade
-- Based on kaizorat_antagloma.sql exported from MariaDB 11.4.12.
-- Purpose: finish the package schema after the failed Laravel migration.
-- IMPORTANT: this script preserves existing users, orders, items, tokens and master data.
-- No DROP, TRUNCATE, DELETE, or data reset is used.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- The failed migration already created this table in the supplied dump.
-- This CREATE is safe if the table is already present.
CREATE TABLE IF NOT EXISTS `order_packages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `letter` varchar(8) NOT NULL,
  `package_type` varchar(255) DEFAULT NULL,
  `weight` decimal(10,2) DEFAULT NULL,
  `nota_printed` tinyint(1) NOT NULL DEFAULT 0,
  `nota_printed_at` timestamp NULL DEFAULT NULL,
  `label_printed` tinyint(1) NOT NULL DEFAULT 0,
  `label_printed_at` timestamp NULL DEFAULT NULL,
  `waiting_photo_at` timestamp NULL DEFAULT NULL,
  `photo_uploaded_at` timestamp NULL DEFAULT NULL,
  `tracking_number` varchar(255) DEFAULT NULL,
  `shipping_cost` decimal(15,2) DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_packages_order_id_letter_unique` (`order_id`,`letter`),
  CONSTRAINT `order_packages_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Short index name avoids MySQL/MariaDB's 64-character identifier limit.
ALTER TABLE `order_packages`
  ADD INDEX IF NOT EXISTS `order_packages_print_state_idx`
    (`nota_printed`, `label_printed`, `photo_uploaded_at`);

-- Persist partial allocation of order items into each package.
CREATE TABLE IF NOT EXISTS `order_package_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_package_id` bigint unsigned NOT NULL,
  `order_item_id` bigint unsigned NOT NULL,
  `quantity` int unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `package_items_package_item_unique` (`order_package_id`, `order_item_id`),
  CONSTRAINT `package_items_package_id_foreign`
    FOREIGN KEY (`order_package_id`) REFERENCES `order_packages` (`id`) ON DELETE CASCADE,
  CONSTRAINT `package_items_order_item_id_foreign`
    FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Attach each packing photo to its specific package while retaining order_id.
ALTER TABLE `packing_images`
  ADD COLUMN IF NOT EXISTS `order_package_id` bigint unsigned NULL AFTER `order_id`;

ALTER TABLE `packing_images`
  ADD INDEX IF NOT EXISTS `packing_images_package_id_index` (`order_package_id`);

-- The supplied dump does not contain this foreign key, so add it once.
-- If a previous manual attempt already added it, skip this statement manually
-- rather than re-running only this line.
ALTER TABLE `packing_images`
  ADD CONSTRAINT `packing_images_package_id_foreign`
    FOREIGN KEY (`order_package_id`) REFERENCES `order_packages` (`id`) ON DELETE CASCADE;

-- Mark the package migration as applied because this script performs its schema work.
-- INSERT IGNORE prevents duplicate migration rows.
INSERT IGNORE INTO `migrations` (`migration`, `batch`)
SELECT '2026_08_08_000011_create_order_packages_table', COALESCE(MAX(`batch`), 0) + 1
FROM `migrations`;

SET FOREIGN_KEY_CHECKS = 1;
