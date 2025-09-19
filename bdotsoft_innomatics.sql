-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Sep 19, 2025 at 05:31 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `bdotsoft_innomatics`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin_users`
--

CREATE TABLE `admin_users` (
  `id` int(11) NOT NULL,
  `email` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admin_users`
--

INSERT INTO `admin_users` (`id`, `email`, `username`, `password`, `full_name`, `last_login`, `created_at`, `updated_at`) VALUES
(1, 'kiran.bjrfx1@gmail.com', 'kiran2456', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kiran Admin', '2025-09-19 14:10:02', '2025-09-19 13:59:43', '2025-09-19 14:10:02'),
(2, 'phanikiran1234@gmail.com', 'phanikiran', 'K143iran', 'Kiran Admin', NULL, '2025-09-19 14:02:03', '2025-09-19 14:02:03');

-- --------------------------------------------------------

--
-- Table structure for table `recordings`
--

CREATE TABLE `recordings` (
  `id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `youtube_url` varchar(500) NOT NULL,
  `youtube_video_id` varchar(20) NOT NULL,
  `description` text DEFAULT NULL,
  `duration` varchar(20) DEFAULT NULL,
  `upload_date` date DEFAULT NULL,
  `thumbnail_url` varchar(500) DEFAULT NULL,
  `view_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `recordings`
--

INSERT INTO `recordings` (`id`, `subject_id`, `title`, `youtube_url`, `youtube_video_id`, `description`, `duration`, `upload_date`, `thumbnail_url`, `view_count`, `created_at`, `updated_at`) VALUES
(1, 6, 'OG vs OMI', 'https://www.youtube.com/watch?v=WepSY1rgoys', 'WepSY1rgoys', 'OG vs OMI', '01:04', '2025-09-19', 'https://img.youtube.com/vi/WepSY1rgoys/maxresdefault.jpg', 0, '2025-09-19 14:12:01', '2025-09-19 14:12:01');

-- --------------------------------------------------------

--
-- Stand-in structure for view `recordings_with_subject`
-- (See below for the actual view)
--
CREATE TABLE `recordings_with_subject` (
`id` int(11)
,`title` varchar(255)
,`youtube_url` varchar(500)
,`youtube_video_id` varchar(20)
,`description` text
,`duration` varchar(20)
,`upload_date` date
,`thumbnail_url` varchar(500)
,`view_count` int(11)
,`recording_created_at` timestamp
,`subject_id` int(11)
,`subject_name` varchar(100)
,`subject_description` text
,`subject_color` varchar(7)
);

-- --------------------------------------------------------

--
-- Table structure for table `subjects`
--

CREATE TABLE `subjects` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `color` varchar(7) DEFAULT '#6366f1',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `subjects`
--

INSERT INTO `subjects` (`id`, `name`, `description`, `color`, `created_at`, `updated_at`) VALUES
(1, 'Python Programming', 'Complete Python programming course from basics to advanced', '#3776ab', '2025-09-19 13:59:43', '2025-09-19 13:59:43'),
(2, 'Data Science', 'Data Science and Machine Learning concepts', '#ff6b35', '2025-09-19 13:59:43', '2025-09-19 13:59:43'),
(3, 'SQL Database', 'SQL queries and database management', '#00758f', '2025-09-19 13:59:43', '2025-09-19 13:59:43'),
(4, 'Web Development', 'HTML, CSS, JavaScript and frameworks', '#61dafb', '2025-09-19 13:59:43', '2025-09-19 13:59:43'),
(5, 'Machine Learning', 'ML algorithms and practical implementations', '#ff6f00', '2025-09-19 13:59:43', '2025-09-19 13:59:43'),
(6, 'OG', 'Pawan Kalyan og songs', '#d10000', '2025-09-19 14:10:59', '2025-09-19 14:10:59');

-- --------------------------------------------------------

--
-- Structure for view `recordings_with_subject`
--
DROP TABLE IF EXISTS `recordings_with_subject`;

CREATE ALGORITHM=UNDEFINED DEFINER=`bdotsoft_innomatics`@`localhost` SQL SECURITY DEFINER VIEW `recordings_with_subject`  AS SELECT `r`.`id` AS `id`, `r`.`title` AS `title`, `r`.`youtube_url` AS `youtube_url`, `r`.`youtube_video_id` AS `youtube_video_id`, `r`.`description` AS `description`, `r`.`duration` AS `duration`, `r`.`upload_date` AS `upload_date`, `r`.`thumbnail_url` AS `thumbnail_url`, `r`.`view_count` AS `view_count`, `r`.`created_at` AS `recording_created_at`, `s`.`id` AS `subject_id`, `s`.`name` AS `subject_name`, `s`.`description` AS `subject_description`, `s`.`color` AS `subject_color` FROM (`recordings` `r` join `subjects` `s` on(`r`.`subject_id` = `s`.`id`)) ORDER BY `s`.`name` ASC, `r`.`upload_date` DESC ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin_users`
--
ALTER TABLE `admin_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `recordings`
--
ALTER TABLE `recordings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_subject_id` (`subject_id`),
  ADD KEY `idx_youtube_video_id` (`youtube_video_id`);

--
-- Indexes for table `subjects`
--
ALTER TABLE `subjects`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin_users`
--
ALTER TABLE `admin_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `recordings`
--
ALTER TABLE `recordings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `subjects`
--
ALTER TABLE `subjects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `recordings`
--
ALTER TABLE `recordings`
  ADD CONSTRAINT `recordings_ibfk_1` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
