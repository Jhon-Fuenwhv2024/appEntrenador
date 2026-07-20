-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 20-07-2026 a las 18:05:00
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `coach_db`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `alumnos_info`
--

CREATE TABLE `alumnos_info` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `sexo` enum('Masculino','Femenino','Otro') DEFAULT NULL,
  `lesiones` text DEFAULT NULL,
  `objetivo` varchar(100) DEFAULT NULL,
  `foto_url` varchar(255) DEFAULT NULL,
  `ultimo_acceso` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `alumnos_info`
--

INSERT INTO `alumnos_info` (`id`, `user_id`, `telefono`, `fecha_nacimiento`, `sexo`, `lesiones`, `objetivo`, `foto_url`, `ultimo_acceso`) VALUES
(1, 4, '3000000000', '2017-01-01', 'Masculino', 'sin lesiones', 'masa muscular', '/uploads/avatars/user_4.jpg', '2026-07-14 16:42:42'),
(2, 5, '3001561618465', '2014-01-27', 'Femenino', 'sin lesiones', 'Bajar de peso', '/uploads/avatars/user_5.webp', '2026-07-14 16:40:02'),
(3, 8, '321205461', NULL, 'Femenino', NULL, 'hkihk', '/uploads/avatars/user_8.webp', '2026-07-14 16:51:56');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `body_composition_logs`
--

CREATE TABLE `body_composition_logs` (
  `id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `recorded_by` int(11) NOT NULL,
  `measured_at` date NOT NULL,
  `weight_kg` decimal(5,2) NOT NULL,
  `height_cm` decimal(5,2) NOT NULL,
  `body_fat_pct` decimal(5,2) DEFAULT NULL,
  `bmi` decimal(5,2) DEFAULT NULL,
  `chest_cm` decimal(5,2) DEFAULT NULL,
  `waist_cm` decimal(5,2) DEFAULT NULL,
  `triceps_cm` decimal(5,2) DEFAULT NULL,
  `biceps_cm` decimal(5,2) DEFAULT NULL,
  `glutes_cm` decimal(5,2) DEFAULT NULL,
  `quads_cm` decimal(5,2) DEFAULT NULL,
  `calves_cm` decimal(5,2) DEFAULT NULL,
  `back_cm` decimal(5,2) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `body_composition_logs`
--

INSERT INTO `body_composition_logs` (`id`, `client_id`, `recorded_by`, `measured_at`, `weight_kg`, `height_cm`, `body_fat_pct`, `bmi`, `chest_cm`, `waist_cm`, `triceps_cm`, `biceps_cm`, `glutes_cm`, `quads_cm`, `calves_cm`, `back_cm`, `notes`, `created_at`, `updated_at`) VALUES
(1, 5, 1, '2026-07-14', 78.00, 160.00, 24.00, 30.47, 98.00, 65.00, 28.00, 29.00, 104.00, 65.00, 32.00, 41.00, NULL, '2026-07-15 00:10:12', '2026-07-15 00:10:12'),
(2, 8, 6, '2026-07-14', 78.00, 160.00, 24.00, 30.47, 25.00, 61.00, 24.00, 25.00, 50.00, 65.00, 45.00, 41.00, NULL, '2026-07-15 00:23:09', '2026-07-15 00:23:09'),
(3, 5, 1, '2026-07-15', 78.00, 160.00, 22.00, 30.47, 98.00, 65.00, 29.00, 29.00, 103.00, 65.00, 41.00, 41.00, NULL, '2026-07-15 16:00:14', '2026-07-15 16:00:14');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `client_memberships`
--

CREATE TABLE `client_memberships` (
  `id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `status` enum('active','owing','expired') NOT NULL DEFAULT 'active',
  `period_start` date DEFAULT NULL,
  `period_end` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `block_on_unpaid` tinyint(1) NOT NULL DEFAULT 0,
  `updated_by` int(11) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `client_memberships`
--

INSERT INTO `client_memberships` (`id`, `client_id`, `status`, `period_start`, `period_end`, `notes`, `block_on_unpaid`, `updated_by`, `updated_at`) VALUES
(1, 4, 'expired', '2026-07-17', '2026-08-16', NULL, 1, 1, '2026-07-17 22:07:55'),
(8, 5, 'active', '2026-07-07', '2026-08-06', NULL, 1, 1, '2026-07-17 20:09:11'),
(23, 10, 'owing', '2026-07-18', '2026-08-17', NULL, 1, 1, '2026-07-18 15:01:11');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `client_streaks`
--

CREATE TABLE `client_streaks` (
  `client_id` int(11) NOT NULL,
  `current_streak` int(11) NOT NULL DEFAULT 0,
  `best_streak` int(11) NOT NULL DEFAULT 0,
  `week_goal` int(11) NOT NULL DEFAULT 3,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `client_streaks`
--

INSERT INTO `client_streaks` (`client_id`, `current_streak`, `best_streak`, `week_goal`, `updated_at`) VALUES
(4, 0, 0, 3, '2026-07-17 22:07:45'),
(5, 0, 5, 7, '2026-07-20 01:32:15'),
(8, 0, 0, 3, '2026-07-18 14:29:02'),
(9, 0, 0, 3, '2026-07-18 14:27:55'),
(10, 0, 0, 3, '2026-07-18 15:00:57');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `diet_items`
--

CREATE TABLE `diet_items` (
  `id` int(11) NOT NULL,
  `diet_meal_id` int(11) NOT NULL,
  `food_name` varchar(150) NOT NULL,
  `quantity` decimal(10,2) NOT NULL DEFAULT 1.00,
  `unit` varchar(50) NOT NULL DEFAULT 'g',
  `calories` decimal(10,2) NOT NULL DEFAULT 0.00,
  `protein_g` decimal(10,2) NOT NULL DEFAULT 0.00,
  `carbs_g` decimal(10,2) NOT NULL DEFAULT 0.00,
  `fats_g` decimal(10,2) NOT NULL DEFAULT 0.00,
  `sort_order` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `diet_items`
--

INSERT INTO `diet_items` (`id`, `diet_meal_id`, `food_name`, `quantity`, `unit`, `calories`, `protein_g`, `carbs_g`, `fats_g`, `sort_order`) VALUES
(7, 7, 'Huevos', 2.00, 'unidad', 500.00, 65.00, 0.00, 0.00, 0),
(8, 7, 'Cafe', 1.00, 'ml', 100.00, 0.00, 100.00, 0.00, 1),
(9, 8, 'Arroz con pollo', 1.00, 'g', 200.00, 300.00, 0.00, 0.00, 0),
(10, 9, 'Ensalada de frutas', 1.00, 'g', 200.00, 0.00, 0.00, 0.00, 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `diet_meals`
--

CREATE TABLE `diet_meals` (
  `id` int(11) NOT NULL,
  `diet_plan_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `time_hint` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `diet_meals`
--

INSERT INTO `diet_meals` (`id`, `diet_plan_id`, `name`, `sort_order`, `time_hint`) VALUES
(7, 1, 'Desayuno', 0, '08:00'),
(8, 1, 'Almuerzo', 1, '12:00'),
(9, 1, 'Cena', 2, '07:30');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `diet_plans`
--

CREATE TABLE `diet_plans` (
  `id` int(11) NOT NULL,
  `trainer_id` int(11) NOT NULL,
  `client_id` int(11) DEFAULT NULL,
  `title` varchar(150) NOT NULL,
  `notes` text DEFAULT NULL,
  `calories` decimal(10,2) NOT NULL DEFAULT 0.00,
  `protein_g` decimal(10,2) NOT NULL DEFAULT 0.00,
  `carbs_g` decimal(10,2) NOT NULL DEFAULT 0.00,
  `fats_g` decimal(10,2) NOT NULL DEFAULT 0.00,
  `is_active` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `diet_plans`
--

INSERT INTO `diet_plans` (`id`, `trainer_id`, `client_id`, `title`, `notes`, `calories`, `protein_g`, `carbs_g`, `fats_g`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 5, 'Volumen', 'seguir indicaciones', 1000.00, 365.00, 100.00, 0.00, 1, '2026-07-18 15:35:16', '2026-07-18 15:57:28');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ejercicios`
--

CREATE TABLE `ejercicios` (
  `id` int(11) NOT NULL,
  `rutina_id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `exercise_id` int(11) DEFAULT NULL,
  `series` int(11) NOT NULL,
  `repeticiones` int(11) NOT NULL,
  `indicaciones` text DEFAULT NULL,
  `peso` decimal(6,2) NOT NULL,
  `rest_time_seconds` int(11) NOT NULL DEFAULT 90 COMMENT 'Descanso entre series (segundos)',
  `superset_letter` varchar(2) DEFAULT NULL COMMENT 'Grupo superserie/circuito (A, B) - Feature 029'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `ejercicios`
--

INSERT INTO `ejercicios` (`id`, `rutina_id`, `nombre`, `exercise_id`, `series`, `repeticiones`, `indicaciones`, `peso`, `rest_time_seconds`, `superset_letter`) VALUES
(20, 8, 'sentadilla profunda', NULL, 3, 10, NULL, 50.00, 90, NULL),
(21, 8, 'extension de cuadriceps', NULL, 3, 10, NULL, 80.00, 90, NULL),
(31, 13, 'Adductor/Groin', NULL, 1, 10, 'Lie on your back with your feet raised towards the ceiling.\nHave your partner hold your feet or ankles. Abduct your legs as far as you can. This will be your starting position.\nAttempt to squeeze your legs together for 10 or more seconds, while your partner prevents you from doing so.\nNow, relax the muscles in your legs as your partner pushes your feet apart, stretching as far as is comfortable for you. Be sure to let your partner know when the stretch is adequate to prevent overstretching or injury.', 0.00, 90, NULL),
(32, 11, 'Backward Drag', NULL, 1, 10, 'Load a sled with the desired weight, attaching a rope or straps to the sled that you can hold onto.\nBegin the exercise by moving backwards for a given distance. Leaning back, extend through the legs for short steps to move as quickly as possible.', 20.00, 90, NULL),
(69, 10, 'E1', NULL, 1, 8, NULL, 10.00, 30, NULL),
(70, 10, 'E2', NULL, 1, 8, NULL, 10.00, 30, NULL),
(71, 5, 'LiveProbe Press', NULL, 2, 8, NULL, 20.00, 30, 'A'),
(72, 5, 'LiveProbe Remo', NULL, 2, 8, NULL, 20.00, 45, 'A'),
(73, 9, 'Board Press', NULL, 2, 10, 'Hold the Ab Roller with both hands and kneel on the floor.\nNow place the ab roller on the floor in front of you so that you are on all your hands and knees (as in a kneeling push up position). This will be your starting position.\nSlowly roll the ab roller straight forward, stretching your body into a straight position. Tip: Go down as far as you can without touching the floor with your body. Breathe in during this portion of the movement.\nAfter a pause at the stretched position, start pulling yourself back to the starting position as you breathe out. Tip: Go slowly and keep your abs tight at all times.', 15.00, 10, 'A'),
(74, 9, 'Bench Sprint', NULL, 2, 10, 'Stand on the ground with one foot resting on a bench or box with your heel close to the edge.\nPush off with your foot on top of the bench, extending through the hip and knee.\nLand with the opposite foot on top of the box, returning your other foot back to the start position.\nContinue alternating from one foot to another to complete the set.', 0.00, 10, 'A'),
(75, 9, 'Adductor/Groin', NULL, 1, 10, 'Lie on your back with your feet raised towards the ceiling.\nHave your partner hold your feet or ankles. Abduct your legs as far as you can. This will be your starting position.\nAttempt to squeeze your legs together for 10 or more seconds, while your partner prevents you from doing so.\nNow, relax the muscles in your legs as your partner pushes your feet apart, stretching as far as is comfortable for you. Be sure to let your partner know when the stretch is adequate to prevent overstretching or injury.', 23.00, 10, 'C'),
(76, 15, 'Bench Jump', NULL, 2, 10, 'Begin with a box or bench 1-2 feet in front of you. Stand with your feet shoulder width apart. This will be your starting position.\nPerform a short squat in preparation for the jump; swing your arms behind you.\nRebound out of this position, extending through the hips, knees, and ankles to jump as high as possible. Swing your arms forward and up.\nJump over the bench, landing with the knees bent, absorbing the impact through the legs.\nTurn around and face the opposite direction, then jump back over the bench.', 0.00, 14, NULL),
(77, 16, 'Alternating Cable Shoulder Press', 38, 2, 10, 'Move the cables to the bottom of the tower and select an appropriate weight.\nGrasp the cables and hold them at shoulder height, palms facing forward. This will be your starting position.\nKeeping your head and chest up, extend through the elbow to press one side directly over head.\nAfter pausing at the top, return to the starting position and repeat on the opposite side.', 30.00, 20, 'B'),
(78, 16, 'Bent Over Low-Pulley Side Lateral', NULL, 3, 10, 'Select a weight and hold the handle of the low pulley with your right hand.\nBend at the waist until your torso is nearly parallel to the floor. Your legs should be slightly bent with your left hand placed on your lower left thigh. Your right arm should be hanging from your shoulder in front of you and with a slight bend at the elbow. This will be your starting position.\nRaise your right arm, elbow slightly bent, to the side until the arm is parallel to the floor and in line with your right ear. Breathe out as you perform this step.\nSlowly lower the weight back to the starting position as you breathe in.\nRepeat for the recommended amount of repetitions and repeat the movement with the other arm.', 80.00, 10, 'B'),
(79, 17, 'Elevaciones Laterales', NULL, 4, 10, 'subir bien los brazos', 5.00, 90, NULL),
(80, 17, 'Press militar', NULL, 3, 10, 'SUBIR BIEN', 20.00, 90, NULL),
(81, 18, 'Crunch Lateral con Mancuerna', 270, 3, 10, 'De pie con la espalda recta y las piernas a la anchura aproximada de la cadera, sujeta la mancuerna con una mano. Flexiona el tronco lateralmente, sin inclinarte hacia delante ni hacia atrás. Baja la mancuerna, sin hacer fuerza con el brazo, deja el peso \"muerto\". Vuelve a la posición inicial sin movimientos bruscos.', 5.00, 2, 'B'),
(82, 18, 'Crunch Inferior con Rodillas Flexionadas', 123, 3, 10, 'Acuéstate boca arriba con los brazos extendidos a los lados del cuerpo y las palmas hacia abajo. Mantén las piernas estiradas y los pies juntos. Contrae los músculos abdominales y glúteos mientras levantas lentamente las piernas hacia arriba, flexionando las rodillas hasta que tus muslos estén a 90 grados del torso. Asegúrate de mantener la []', 0.00, 20, 'B');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `exercises`
--

CREATE TABLE `exercises` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `name_es` varchar(150) DEFAULT NULL COMMENT 'Nombre en español (scraping Fitcron)',
  `description` text DEFAULT NULL,
  `description_es` text DEFAULT NULL COMMENT 'Descripción en español (scraping Fitcron)',
  `target_muscle` varchar(100) NOT NULL,
  `target_muscle_es` varchar(100) DEFAULT NULL COMMENT 'Grupo muscular en español (opcional)',
  `primary_muscle` varchar(100) DEFAULT NULL COMMENT 'Músculo principal (taxonomía HITL)',
  `secondary_muscles` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Músculos secundarios (array JSON de strings)' CHECK (json_valid(`secondary_muscles`)),
  `is_warmup` tinyint(1) NOT NULL DEFAULT 0 COMMENT '1 = usable como calentamiento para el músculo etiquetado',
  `media_type` enum('image','gif','youtube','video','none') NOT NULL DEFAULT 'none',
  `media_url` varchar(500) DEFAULT NULL,
  `local_media_path` varchar(500) DEFAULT NULL COMMENT 'Ruta relativa local, ej. /uploads/exercises/exercise_12.gif',
  `created_by_trainer_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `exercises`
--

INSERT INTO `exercises` (`id`, `name`, `name_es`, `description`, `description_es`, `target_muscle`, `target_muscle_es`, `primary_muscle`, `secondary_muscles`, `is_warmup`, `media_type`, `media_url`, `local_media_path`, `created_by_trainer_id`, `created_at`) VALUES
(34, 'Alternate Hammer Curl', 'Curl Inclinado Neutro Alterno con Mancuernas', 'Stand up with your torso upright and a dumbbell in each hand being held at arms length. The elbows should be close to the torso.\nThe palms of the hands should be facing your torso. This will be your starting position.\nWhile holding the upper arm stationary, curl the right weight forward while contracting the biceps as you breathe out. Continue the movement until your biceps is fully contracted and the dumbbells are at shoulder level. Hold the contracted position for a second as you squeeze the biceps. Tip: Only the forearms should move.\nSlowly begin to bring the dumbbells back to starting position as your breathe in.\nRepeat the movement with the left hand. This equals one repetition.\nContinue alternating in this manner for the recommended amount of repetitions.', 'Sentado en un banco inclinado, coge una mancuerna con cada mano con las palmas hacia el interior (agarre neutro o martillo) y deja caer los brazos a ambos lados del cuerpo. Flexiona un codo subiendo la mancuerna a la altura del pecho. Mientras desciende, sube el otro brazo.', 'biceps', 'Bíceps', 'Bíceps', '[\"Braquial\",\"Antebrazo\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Alternate_Hammer_Curl/images/0.jpg', '/uploads/exercises/exercise_34.gif', NULL, '2026-07-13 22:23:41'),
(35, 'Alternate Heel Touchers', 'Crunch Lateral Horizontal Alterno', 'Lie on the floor with the knees bent and the feet on the floor around 18-24 inches apart. Your arms should be extended by your side. This will be your starting position.\nCrunch over your torso forward and up about 3-4 inches to the right side and touch your right heel as you hold the contraction for a second. Exhale while performing this movement.\nNow go back slowly to the starting position as you inhale.\nNow crunch over your torso forward and up around 3-4 inches to the left side and touch your left heel as you hold the contraction for a second. Exhale while performing this movement and then go back to the starting position as you inhale. Now that both heels have been touched, that is considered 1 repetition.\nContinue alternating sides in this manner until all prescribed repetitions are done.', 'Acuéstate boca arriba con las rodillas dobladas y los pies apoyados en el suelo. Mantén los brazos extendidos a los lados del cuerpo con las palmas hacia abajo. Levanta ligeramente la cabeza, los hombros y la parte superior de la espalda del suelo. Desde esta posición, lleva una mano hacia el talón del mismo lado, []', 'abdominals', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Alternate_Heel_Touchers/images/0.jpg', '/uploads/exercises/exercise_35.gif', NULL, '2026-07-13 22:23:41'),
(36, 'Alternate Incline Dumbbell Curl', 'Curl Inclinado Alterno en Supinación con Mancuernas', 'Sit down on an incline bench with a dumbbell in each hand being held at arms length. Tip: Keep the elbows close to the torso.This will be your starting position.\nWhile holding the upper arm stationary, curl the right weight forward while contracting the biceps as you breathe out. As you do so, rotate the hand so that the palm is facing up. Continue the movement until your biceps is fully contracted and the dumbbells are at shoulder level. Hold the contracted position for a second as you squeeze the biceps. Tip: Only the forearms should move.\nSlowly begin to bring the dumbbell back to starting position as your breathe in.\nRepeat the movement with the left hand. This equals one repetition.\nContinue alternating in this manner for the recommended amount of repetitions.', 'Tumbado hacia arriba en un banco inclinado, coge una mancuerna con cada mano con las palmas hacia delante (supinación). Deja caer los brazos a ambos lados del cuerpo. Sube una mancuerna flexionando el codo hasta llegar a la altura del pecho. Desciende completamente y al llegar a abajo, sube el otro brazo.', 'biceps', 'Bíceps', 'Bíceps', '[\"Braquial\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Alternate_Incline_Dumbbell_Curl/images/0.jpg', '/uploads/exercises/exercise_36.gif', NULL, '2026-07-13 22:23:41'),
(38, 'Alternating Cable Shoulder Press', 'Press Militar en Polea', 'Move the cables to the bottom of the tower and select an appropriate weight.\nGrasp the cables and hold them at shoulder height, palms facing forward. This will be your starting position.\nKeeping your head and chest up, extend through the elbow to press one side directly over head.\nAfter pausing at the top, return to the starting position and repeat on the opposite side.', 'De pie entre dos poleas con la espalda recta y las piernas a la anchura de los hombros, coge una polea baja con cada mano y ponlas a los lados de la cabeza con los brazos flexionados y con agarre en pronación (palmas hacia delante). Levanta las manos hacia arriba estirando bien los brazos y []', 'shoulders', 'Hombro', 'Hombros', '[\"Tríceps\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Alternating_Cable_Shoulder_Press/images/0.jpg', '/uploads/exercises/exercise_38.gif', NULL, '2026-07-13 22:23:41'),
(48, 'Anti-Gravity Press', 'Elevación Frontal Declinada Abierta con Barra Z', 'Place a bar on the ground behind the head of an incline bench.\nLay on the bench face down. With a pronated grip, pick the barbell up from the floor. Flex the elbows, performing a reverse curl to bring the bar near your chest. This will be your starting position.\nTo begin, press the barbell out in front of your head by extending your elbows. Keep your arms parallel to the ground throughout the movement.\nReturn to the starting position and repeat to complete the set.', 'Túmbate hacia abajo en un banco declinado, apoyando el pecho en el respaldo y con los pies en el suelo. Coge la barra con las manos en pronación (palmas hacia abajo) a la anchura máxima posible. Con los codos ligeramente flexionados, eleva la barra hasta tener los brazos perpendiculares al cuerpo y desciende de nuevo []', 'shoulders', 'Hombro', 'Hombros', '[\"Braquial\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Anti-Gravity_Press/images/0.jpg', '/uploads/exercises/exercise_48.gif', NULL, '2026-07-13 22:23:41'),
(50, 'Arnold Dumbbell Press', 'Press Arnold Abierto con Mancuernas', 'Sit on an exercise bench with back support and hold two dumbbells in front of you at about upper chest level with your palms facing your body and your elbows bent. Tip: Your arms should be next to your torso. The starting position should look like the contracted portion of a dumbbell curl.\nNow to perform the movement, raise the dumbbells as you rotate the palms of your hands until they are facing forward.\nContinue lifting the dumbbells until your arms are extended above you in straight arm position. Breathe out as you perform this portion of the movement.\nAfter a second pause at the top, begin to lower the dumbbells to the original position by rotating the palms of your hands towards you. Tip: The left arm will be rotated in a counter clockwise manner while the right one will be rotated clockwise. Breathe in as you perform this portion of the movement.\nRepeat for the recommended amount of repetitions.', 'Sentado con la espalda recta, coge una mancuerna con cada mano y ponlas a los lados de los hombros con los codos flexionados hacia arriba y con agarre neutro (palmas enfrentadas). Levanta las mancuernas hacia arriba estirando bien los brazos y abriendo a los lados, girando las muñecas para que queden las palmas hacia delante. []', 'shoulders', 'Hombro', 'Hombros', '[\"Tríceps\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Arnold_Dumbbell_Press/images/0.jpg', '/uploads/exercises/exercise_50.gif', NULL, '2026-07-13 22:23:41'),
(64, 'Band Pull Apart', 'Extensiones Laterales con Banda', 'Begin with your arms extended straight out in front of you, holding the band with both hands.\nInitiate the movement by performing a reverse fly motion, moving your hands out laterally to your sides.\nKeep your elbows extended as you perform the movement, bringing the band to your chest. Ensure that you keep your shoulders back during the exercise.\nPause as you complete the movement, returning to the starting position under control.', 'De pie con la espalda recta y las piernas a la anchura de los hombros, coge una banda con las dos manos delante de cada hombro, con los brazos extendidos paralelos al suelo y las palmas enfrentadas. Estira los brazos hacia los lados lados todo lo que puedas y retrocede a la posición inicial.', 'shoulders', 'Hombro', 'Hombros', '[\"Trapecio\"]', 1, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Band_Pull_Apart/images/0.jpg', '/uploads/exercises/exercise_64.gif', NULL, '2026-07-13 22:23:41'),
(65, 'Band Skull Crusher', 'Press Francés con Bandas', 'Secure a band to the base of a rack or the bench. Lay on the bench so that the band is lined up with your head.\nTake hold of the band, raising your elbows so that the upper arm is perpendicular to the floor. With the elbow flexed, the band should be above your head. This will be your starting position.\nExtend through the elbow to straighten your arm, keeping your upper arm in place. Pause at the top of the motion, and return to the starting position.', 'Tumbado hacia arriba en un banco plano, ancla las bandas a las patas del banco y coge un extremo con cada mano, con las palmas hacia arriba (agarre en pronación) a la altura del pecho y a la anchura de los hombros (una mano delante de cada pectoral). Estira los brazos tensando bien los tríceps, []', 'triceps', 'Tríceps', 'Tríceps', '[]', 1, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Band_Skull_Crusher/images/0.jpg', '/uploads/exercises/exercise_65.gif', NULL, '2026-07-13 22:23:41'),
(68, 'Barbell Bench Press - Medium Grip', 'Press Banca con Barra', 'Lie back on a flat bench. Using a medium width grip (a grip that creates a 90-degree angle in the middle of the movement between the forearms and the upper arms), lift the bar from the rack and hold it straight over you with your arms locked. This will be your starting position.\nFrom the starting position, breathe in and begin coming down slowly until the bar touches your middle chest.\nAfter a brief pause, push the bar back to the starting position as you breathe out. Focus on pushing the bar using your chest muscles. Lock your arms and squeeze your chest in the contracted position at the top of the motion, hold for a second and then start coming down slowly again. Tip: Ideally, lowering the weight should take about twice as long as raising it.\nRepeat the movement for the prescribed amount of repetitions.\nWhen you are done, place the bar back in the rack.', 'Tumbado sobre un banco horizontal, los brazos estirados verticalmente, agarramos la barra con las manos en pronación un poco más abiertas de la anchura de los hombros. El movimiento consiste en bajar la barra hasta el pecho, sin descansar abajo, y luego subir hasta la posición inicial. La inspiración se hace durante el descenso, la []', 'chest', 'Pecho', 'Pecho', '[\"Tríceps\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Barbell_Bench_Press_-_Medium_Grip/images/0.jpg', '/uploads/exercises/exercise_68.gif', NULL, '2026-07-13 22:23:41'),
(69, 'Barbell Curl', 'Curl en Supinación con Barra', 'Stand up with your torso upright while holding a barbell at a shoulder-width grip. The palm of your hands should be facing forward and the elbows should be close to the torso. This will be your starting position.\nWhile holding the upper arms stationary, curl the weights forward while contracting the biceps as you breathe out. Tip: Only the forearms should move.\nContinue the movement until your biceps are fully contracted and the bar is at shoulder level. Hold the contracted position for a second and squeeze the biceps hard.\nSlowly begin to bring the bar back to starting position as your breathe in.\nRepeat for the recommended amount of repetitions.', 'De pie con la espalda recta y las piernas ligeramente separadas, coge la barra con las manos a la anchura de los hombros, con las palmas hacia arriba (supinación). Sube la barra flexionando los codos y desciende de forma controlada.', 'biceps', 'Bíceps', 'Bíceps', '[\"Antebrazo\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Barbell_Curl/images/0.jpg', '/uploads/exercises/exercise_69.gif', NULL, '2026-07-13 22:23:41'),
(71, 'Barbell Deadlift', 'Peso Muerto con Barra', 'Stand in front of a loaded barbell.\nWhile keeping the back as straight as possible, bend your knees, bend forward and grasp the bar using a medium (shoulder width) overhand grip. This will be the starting position of the exercise. Tip: If it is difficult to hold on to the bar with this grip, alternate your grip or use wrist straps.\nWhile holding the bar, start the lift by pushing with your legs while simultaneously getting your torso to the upright position as you breathe out. In the upright position, stick your chest out and contract the back by bringing the shoulder blades back. Think of how the soldiers in the military look when they are in standing in attention.\nGo back to the starting position by bending at the knees while simultaneously leaning the torso forward at the waist while keeping the back straight. When the weights on the bar touch the floor you are back at the starting position and ready to perform another repetition.\nPerform the amount of repetitions prescribed in the program.', 'De pie con la espalda recta, sujeta la barra con las manos en pronación (palmas hacia atrás) a la anchura de los hombros, activando ligeramente las escápulas y con el pecho fuera. Las piernas separadas a la anchura de la cadera. Flexiona las rodillas casi 90º, empujando la cadera hacia atrás, dejando todo el peso []', 'lower back', 'Pierna', 'Femoral', '[\"Glúteo\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Barbell_Deadlift/images/0.jpg', '/uploads/exercises/exercise_71.gif', NULL, '2026-07-13 22:23:41'),
(72, 'Barbell Full Squat', 'Sentadilla Profunda con Barra', 'This exercise is best performed inside a squat rack for safety purposes. To begin, first set the bar on a rack just above shoulder level. Once the correct height is chosen and the bar is loaded, step under the bar and place the back of your shoulders (slightly below the neck) across it.\nHold on to the bar using both arms at each side and lift it off the rack by first pushing with your legs and at the same time straightening your torso.\nStep away from the rack and position your legs using a shoulder-width medium stance with the toes slightly pointed out. Keep your head up at all times and maintain a straight back. This will be your starting position.\nBegin to slowly lower the bar by bending the knees and sitting back with your hips as you maintain a straight posture with the head up. Continue down until your hamstrings are on your calves. Inhale as you perform this portion of the movement.\nBegin to raise the bar as you exhale by pushing the floor with the heel or middle of your foot as you straighten the legs and extend the hips to go back to the starting position.\nRepeat for the recommended amount of repetitions.', 'De pie con las piernas separadas a la anchura de los hombros y una barra sobre el trapecio, ayudando a mantenerla con las manos a los lados de los hombros. Desciende flexionando las rodillas y bajando los glúteos hasta su altura, sin descansar abajo, subiendo de nuevo y estirando bien arriba.', 'quadriceps', 'Pierna', 'Cuádriceps', '[\"Glúteo\",\"Gemelos\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Barbell_Full_Squat/images/0.jpg', '/uploads/exercises/exercise_72.gif', NULL, '2026-07-13 22:23:41'),
(73, 'Barbell Glute Bridge', 'Hip Thrust con Barra', 'Begin seated on the ground with a loaded barbell over your legs. Using a fat bar or having a pad on the bar can greatly reduce the discomfort caused by this exercise. Roll the bar so that it is directly above your hips, and lay down flat on the floor.\nBegin the movement by driving through with your heels, extending your hips vertically through the bar. Your weight should be supported by your upper back and the heels of your feet.\nExtend as far as possible, then reverse the motion to return to the starting position.', 'Tumbado hacia arriba en el suelo con las piernas flexionadas, ponte una barra sobre la cadera. Eleva la pelvis tensando bien los glúteos arriba.', 'glutes', 'Pierna', 'Glúteo', '[\"Femoral\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Barbell_Glute_Bridge/images/0.jpg', '/uploads/exercises/exercise_73.gif', NULL, '2026-07-13 22:23:41'),
(76, 'Barbell Hip Thrust', 'Hip Thrust Inclinado con Barra', 'Begin seated on the ground with a bench directly behind you. Have a loaded barbell over your legs. Using a fat bar or having a pad on the bar can greatly reduce the discomfort caused by this exercise.\nRoll the bar so that it is directly above your hips, and lean back against the bench so that your shoulder blades are near the top of it.\nBegin the movement by driving through your feet, extending your hips vertically through the bar. Your weight should be supported by your shoulder blades and your feet. Extend as far as possible, then reverse the motion to return to the starting position.', 'Tumbado hacia arriba en el suelo con las piernas flexionadas, ponte una barra sobre la cadera. Apoya la parte alta de la espalda sobre un banco. Eleva la pelvis tensando bien los glúteos arriba, con la espalda sobre el banco.', 'glutes', 'Pierna', 'Glúteo', '[\"Femoral\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Barbell_Hip_Thrust/images/0.jpg', '/uploads/exercises/exercise_76.gif', NULL, '2026-07-13 22:23:41'),
(77, 'Barbell Incline Bench Press - Medium Grip', 'Press Inclinado con Barra', 'Lie back on an incline bench. Using a medium-width grip (a grip that creates a 90-degree angle in the middle of the movement between the forearms and the upper arms), lift the bar from the rack and hold it straight over you with your arms locked. This will be your starting position.\nAs you breathe in, come down slowly until you feel the bar on you upper chest.\nAfter a second pause, bring the bar back to the starting position as you breathe out and push the bar using your chest muscles. Lock your arms in the contracted position, squeeze your chest, hold for a second and then start coming down slowly again. Tip: it should take at least twice as long to go down than to come up.\nRepeat the movement for the prescribed amount of repetitions.\nWhen you are done, place the bar back in the rack.', 'Tumbado sobre un banco inclinado, los brazos estirados verticalmente, agarramos la barra con las manos en pronación y un poco más abiertas de la anchura de los hombros. El movimiento consiste en bajar la barra hasta el pecho, sin descansar abajo, y luego subir hasta la posición inicial​. La inspiración se hace durante el descenso, []', 'chest', 'Pecho', 'Pecho', '[\"Tríceps\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Barbell_Incline_Bench_Press_-_Medium_Grip/images/0.jpg', '/uploads/exercises/exercise_77.gif', NULL, '2026-07-13 22:23:41'),
(82, 'Barbell Seated Calf Raise', 'Extensión de Gemelos sentado con Barra', 'Place a block about 12 inches in front of a flat bench.\nSit on the bench and place the ball of your feet on the block.\nHave someone place a barbell over your upper thighs about 3 inches above your knees and hold it there. This will be your starting position.\nRaise up on your toes as high as possible as you squeeze the calves and as you breathe out.\nAfter a second contraction, slowly go back to the starting position. Tip: To get maximum benefit stretch your calves as far as you can.\nRepeat for the recommended amount of repetitions.', 'Sentado en un banco o similar, con las piernas juntas, ponte una barra sobre las rodillas ayudando a mantenerla con las manos. Ponte de puntillas estirando bien los gemelos y desciende, repetidamente hasta terminar la serie. Puedes poner la parte delantera de los pies al borde de un step o plataforma para mayor recorrido.', 'calves', 'Pierna', 'Gemelos', '[]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Barbell_Seated_Calf_Raise/images/0.jpg', '/uploads/exercises/exercise_82.gif', NULL, '2026-07-13 22:23:41'),
(84, 'Barbell Shrug', 'Encogimientos Delanteros con Barra', 'Stand up straight with your feet at shoulder width as you hold a barbell with both hands in front of you using a pronated grip (palms facing the thighs). Tip: Your hands should be a little wider than shoulder width apart. You can use wrist wraps for this exercise for a better grip. This will be your starting position.\nRaise your shoulders up as far as you can go as you breathe out and hold the contraction for a second. Tip: Refrain from trying to lift the barbell by using your biceps.\nSlowly return to the starting position as you breathe in.\nRepeat for the recommended amount of repetitions.', 'De pie con las piernas ligeramente separadas y la espalda recta, coge una barra por delante del cuerpo con las manos en pronación (palmas hacia atrás) a una anchura algo superior a la de los hombros. Encoge los hombros sin flexionar los brazos, subiendo y bajando el peso exclusivamente con el trapecio.', 'traps', 'Hombro', 'Trapecio', '[\"Espalda\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Barbell_Shrug/images/0.jpg', '/uploads/exercises/exercise_84.gif', NULL, '2026-07-13 22:23:41'),
(85, 'Barbell Shrug Behind The Back', 'Encogimientos Traseros con Barra', 'Stand up straight with your feet at shoulder width as you hold a barbell with both hands behind your back using a pronated grip (palms facing back). Tip: Your hands should be a little wider than shoulder width apart. You can use wrist wraps for this exercise for better grip. This will be your starting position.\nRaise your shoulders up as far as you can go as you breathe out and hold the contraction for a second. Tip: Refrain from trying to lift the barbell by using your biceps. The arms should remain stretched out at all times.\nSlowly return to the starting position as you breathe in.\nRepeat for the recommended amount of repetitions.', 'De pie con las piernas ligeramente separadas y la espalda recta, coge una barra por detrás del cuerpo con las manos en pronación (palmas hacia atrás) a una anchura algo superior a la de los hombros. Encoge los hombros sin flexionar los brazos, subiendo y bajando el peso exclusivamente con el trapecio.', 'traps', 'Hombro', 'Trapecio', '[\"Espalda\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Barbell_Shrug_Behind_The_Back/images/0.jpg', '/uploads/exercises/exercise_85.gif', NULL, '2026-07-13 22:23:41'),
(87, 'Barbell Side Split Squat', 'Sentadilla en zancada con Barra', 'Stand up straight while holding a barbell placed on the back of your shoulders (slightly below the neck). Your feet should be placed wide apart with the foot of the lead leg angled out to the side. This will be your starting position.\nLower your body towards the side of your angled foot by bending the knee and hip of your lead leg and while keeping the opposite leg only slightly bent. Breathe in as you lower your body.\nReturn to the starting position by extending the hip and knee of the lead leg. Breathe out as you perform this movement.\nAfter performing the recommended amount of reps, repeat the movement with the opposite leg.', 'De pie coge una barra sobre el trapecio, ayudando a mantenerla con las manos a los lados de los hombros. Da un paso adelantando una pierna y flexionando ambas ligeramente. Inclínate hacia delante flexionando la pierna adelantada a 90º. Vuelve a estirar la pierna sin despegar el pie.', 'quadriceps', 'Pierna', 'Cuádriceps', '[\"Glúteo\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Barbell_Side_Split_Squat/images/0.jpg', '/uploads/exercises/exercise_87.gif', NULL, '2026-07-13 22:23:41'),
(89, 'Barbell Squat To A Bench', 'Media Sentadilla con Barra', 'This exercise is best performed inside a squat rack for safety purposes. To begin, first place a flat bench or a box behind you. The flat bench is used to teach you to set your hips back and to hit depth.\nThen, set the bar on a rack that best matches your height. Once the correct height is chosen and the bar is loaded, step under the bar and place the back of your shoulders (slightly below the neck) across it.\nHold on to the bar using both arms at each side and lift it off the rack by first pushing with your legs and at the same time straightening your torso.\nStep away from the rack and position your legs using a shoulder width medium stance with the toes slightly pointed out. Keep your head up at all times as looking down will get you off balance and also maintain a straight back. This will be your starting position. (Note: For the purposes of this discussion we will use the medium stance described above which targets overall development; however you can choose any of the three stances discussed in the foot stances section).\nBegin to slowly lower the bar by bending the knees and sitting your hips back as you maintain a straight posture with the head up. Continue down until you slightly touch the bench behind you. Inhale as you perform this portion of the movement. Tip: If you performed the exercise correctly, the front of the knees should make an imaginary straight line with the toes that is perpendicular to the front. If your knees are past that imaginary line (if they are past your toes) then you are placing undue stress on the knee and the exercise has been performed incorrectly.\nBegin to raise the bar as you exhale by pushing the floor with the heel of your foot as you straighten the legs and extend the hips to go back to the starting position.\nRepeat for the recommended amount of repetitions.', 'De pie delante de un banco o silla, con las piernas separadas a la anchura de los hombros y una barra sobre el trapecio, ayudando a mantenerla con las manos a los lados de los hombros. Desciende flexionando las rodillas 90º hasta tocar el banco con los glúteos, sin descansar en él, subiendo de nuevo []', 'quadriceps', 'Pierna', 'Pierna', '[\"Glúteo\"]', 1, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Barbell_Squat_To_A_Bench/images/0.jpg', '/uploads/exercises/exercise_89.gif', NULL, '2026-07-13 22:23:41'),
(101, 'Bent-Arm Barbell Pullover', 'Pullover Declinado Cerrado con Barra', 'Lie on a flat bench with a barbell using a shoulder grip width.\nHold the bar straight over your chest with a bend in your arms. This will be your starting position.\nWhile keeping your arms in the bent arm position, lower the weight slowly in an arc behind your head while breathing in until you feel a stretch on the chest.\nAt that point, bring the barbell back to the starting position using the arc through which the weight was lowered and exhale as you perform this movement.\nHold the weight on the initial position for a second and repeat the motion for the prescribed number of repetitions.', 'Tumbado sobre un banco plano, agarra la barra con las manos casi juntas, en pronación (palma de la mano hacia los pies). Con los brazos estirados, llévalos hacia atrás de la cabeza flexionándolos un poco. Una vez abajo, vuelve a subir la barra con los brazos extendidos al llegar sobre el pecho. Se puede hacer []', 'lats', 'Pecho', 'Pecho', '[\"Dorsal\",\"Tríceps\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Bent-Arm_Barbell_Pullover/images/0.jpg', '/uploads/exercises/exercise_101.gif', NULL, '2026-07-13 22:23:41'),
(103, 'Bent-Knee Hip Raise', 'Elevación de Cadera con piernas flexionadas', 'Lay flat on the floor with your arms next to your sides.\nNow bend your knees at around a 75 degree angle and lift your feet off the floor by around 2 inches.\nUsing your lower abs, bring your knees in towards you as you maintain the 75 degree angle bend in your legs. Continue this movement until you raise your hips off of the floor by rolling your pelvis backward. Breathe out as you perform this portion of the movement. Tip: At the end of the movement your knees will be over your chest.\nSqueeze your abs at the top of the movement for a second and then return to the starting position slowly as you breathe in. Tip: Maintain a controlled motion at all times.\nRepeat for the recommended amount of repetitions.', 'Acuéstate boca arriba con las rodillas dobladas y los pies apoyados en el suelo, manteniendo las manos a los lados del cuerpo con las palmas hacia abajo. Levanta lentamente las caderas del suelo, manteniendo las rodillas dobladas en un ángulo de aproximadamente 90 grados. Alcanza la posición más alta posible y luego baja las caderas []', 'abdominals', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Bent-Knee_Hip_Raise/images/0.jpg', '/uploads/exercises/exercise_103.gif', NULL, '2026-07-13 22:23:41'),
(104, 'Bent Over Barbell Row', 'Remo en Pronación con Barra', 'Holding a barbell with a pronated grip (palms facing down), bend your knees slightly and bring your torso forward, by bending at the waist, while keeping the back straight until it is almost parallel to the floor. Tip: Make sure that you keep the head up. The barbell should hang directly in front of you as your arms hang perpendicular to the floor and your torso. This is your starting position.\nNow, while keeping the torso stationary, breathe out and lift the barbell to you. Keep the elbows close to the body and only use the forearms to hold the weight. At the top contracted position, squeeze the back muscles and hold for a brief pause.\nThen inhale and slowly lower the barbell back to the starting position.\nRepeat for the recommended amount of repetitions.', 'Sosteniendo una barra con un agarre prono (palmas hacia abajo) a la anchura de los hombros, flexiona ligeramente las rodillas con las piernas separadas e inclina el torso hacia delante. Ahora, mientras mantienes el torso inmóvil, coge aire mientras levantas la barra hasta llegar bajo el pecho, con contracción escapular y aguantando un segundo arriba. []', 'middle back', 'Espalda', 'Espalda', '[\"Dorsal\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Bent_Over_Barbell_Row/images/0.jpg', '/uploads/exercises/exercise_104.gif', NULL, '2026-07-13 22:23:41'),
(109, 'Bent Over Two-Dumbbell Row', 'Remo Neutro con Mancuernas', 'With a dumbbell in each hand (palms facing your torso), bend your knees slightly and bring your torso forward by bending at the waist; as you bend make sure to keep your back straight until it is almost parallel to the floor. Tip: Make sure that you keep the head up. The weights should hang directly in front of you as your arms hang perpendicular to the floor and your torso. This is your starting position.\nWhile keeping the torso stationary, lift the dumbbells to your side (as you breathe out), keeping the elbows close to the body (do not exert any force with the forearm other than holding the weights). On the top contracted position, squeeze the back muscles and hold for a second.\nSlowly lower the weight again to the starting position as you inhale.\nRepeat for the recommended amount of repetitions.', 'Sosteniendo dos mancuernas en agarre neutro (palmas hacia el interior) a la anchura de los hombros, flexiona ligeramente las rodillas con las piernas separadas e inclina el torso hacia delante. Ahora, mientras mantienes el torso inmóvil, coge aire mientras levantas las mancuernas hasta llegar bajo el pecho, con contracción escapular y aguantando un segundo arriba. []', 'middle back', 'Espalda', 'Espalda', '[\"Dorsal\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Bent_Over_Two-Dumbbell_Row/images/0.jpg', '/uploads/exercises/exercise_109.gif', NULL, '2026-07-13 22:23:41'),
(115, 'Body-Up', 'Flexiones con codos', 'Assume a plank position on the ground. You should be supporting your bodyweight on your toes and forearms, keeping your torso straight. Your forearms should be shoulder-width apart. This will be your starting position.\nPressing your palms firmly into the ground, extend through the elbows to raise your body from the ground. Keep your torso rigid as you perform the movement.\nSlowly lower your forearms back to the ground by allowing the elbows to flex.\nRepeat.', 'Tumbado hacia abajo en el suelo, apoya las punteras de los pies y los antebrazos completamente (posición de plancha). Sube el cuerpo estirando los brazos de forma que apoyes solo las manos. Estira bien arriba y baja lentamente de nuevo, apoyando los codos. Mantén la espalda recta y tensa los abdominales y el pecho.', 'triceps', 'Tríceps', 'Tríceps', '[\"Pecho\"]', 1, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Body-Up/images/0.jpg', '/uploads/exercises/exercise_115.gif', NULL, '2026-07-13 22:23:41'),
(123, 'Bottoms Up', 'Crunch Inferior con Rodillas Flexionadas', 'Begin by lying on your back on the ground. Your legs should be straight and your arms at your side. This will be your starting position.\nTo perform the movement, tuck the knees toward your chest by flexing the hips and knees. Following this, extend your legs directly above you so that they are perpendicular to the ground. Rotate and elevate your pelvis to raise your glutes from the floor.\nAfter a brief pause, return to the starting position.', 'Acuéstate boca arriba con los brazos extendidos a los lados del cuerpo y las palmas hacia abajo. Mantén las piernas estiradas y los pies juntos. Contrae los músculos abdominales y glúteos mientras levantas lentamente las piernas hacia arriba, flexionando las rodillas hasta que tus muslos estén a 90 grados del torso. Asegúrate de mantener la []', 'abdominals', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Bottoms_Up/images/0.jpg', '/uploads/exercises/exercise_123.gif', NULL, '2026-07-13 22:23:41'),
(134, 'Cable Chest Press', 'Press Frontal con Poleas', 'Adjust the weight to an appropriate amount and be seated, grasping the handles. Your upper arms should be about 45 degrees to the body, with your head and chest up. The elbows should be bent to about 90 degrees. This will be your starting position.\nBegin by extending through the elbow, pressing the handles together straight in front of you. Keep your shoulder blades retracted as you execute the movement.\nAfter pausing at full extension, return to th starting position, keeping tension on the cables.\nYou can also execute this movement with your back off the pad, at an incline or decline, or alternate hands.', 'Sentado sobre un banco con el respaldo a 90º y la espalda recta, colocar las poleas a la altura del pecho y agarrar ambas empuñaduras en pronación (palmas hacia el suelo). Extender los brazos al frente quedando bien estirados y con las manos delante del pecho (anchura de los hombros o algo menos). Retroceder lentamente []', 'chest', 'Pecho', 'Pecho', '[\"Tríceps\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Cable_Chest_Press/images/0.jpg', '/uploads/exercises/exercise_134.gif', NULL, '2026-07-13 22:23:41'),
(139, 'Cable Hip Adduction', 'Aductor Interno en Polea Baja', 'Stand in front of a low pulley facing forward with one leg next to the pulley and the other one away.\nAttach the ankle cuff to the cable and also to the ankle of the leg that is next to the pulley.\nNow step out and away from the stack with a wide stance and grasp the bar of the pulley system.\nStand on the foot that does not have the ankle cuff (the far foot) and allow the leg with the cuff to be pulled towards the low pulley. This will be your starting position.\nNow perform the movement by moving the leg with the ankle cuff in front of the far leg by using the inner thighs to abduct the hip. Breathe out during this portion of the movement.\nSlowly return to the starting position as you breathe in.\nRepeat for the recommended amount of repetitions and then repeat the same movement with the opposite leg.', 'Ponte de pie al lado de una máquina de polea. Sujeta la polea al tobillo de la pierna cercana a la polea. Apóyate con las manos para conservar el equilibrio y desde allí comienza el movimiento. Sin movilizar el torso, despega la pierna que sujeta el peso del suelo y llévala desde la máquina hacia []', 'quadriceps', 'Pierna', 'Aductores', '[]', 1, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Cable_Hip_Adduction/images/0.jpg', '/uploads/exercises/exercise_139.gif', NULL, '2026-07-13 22:23:41'),
(140, 'Cable Incline Pushdown', 'Serratos Inclinados Cerrados con Barra en Polea', 'Lie on incline an bench facing away from a high pulley machine that has a straight bar attachment on it.\nGrasp the straight bar attachment overhead with a pronated (overhand; palms down) shoulder width grip and extend your arms in front of you. The bar should be around 2 inches away from your upper thighs. This will be your starting position.\nKeeping the upper arms stationary, lift your arms back in a semi circle until the bar is straight over your head. Breathe in during this portion of the movement.\nSlowly go back to the starting position using your lats and hold the contraction once you reach the starting position. Breathe out during the execution of this movement.\nRepeat for the recommended amount of repetitions.', 'Tumbado hacia arriba en un banco inclinado de espaldas a la polea alta, extiende los brazos cogiendo la barra con las palmas hacia delante a una anchura inferior a la de los hombros. Con los brazos rectos, baja la barra hasta la altura del esternón, apretando los dorsales y aguantando un poco, para volver a []', 'lats', 'Espalda', 'Dorsal', '[\"Pecho\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Cable_Incline_Pushdown/images/0.jpg', '/uploads/exercises/exercise_140.gif', NULL, '2026-07-13 22:23:41'),
(141, 'Cable Incline Triceps Extension', 'Press Francés Inclinado con Polea', 'Lie on incline an bench facing away from a high pulley machine that has a straight bar attachment on it.\nGrasp the straight bar attachment overhead with a pronated (overhand; palms down) narrow grip (less than shoulder width) and keep your elbows tucked in to your sides. Your upper arms should create around a 25 degree angle when measured from the floor.\nKeeping the upper arms stationary, extend the arms as you flex the triceps. Breathe out during this portion of the movement and hold the contraction for a second.\nSlowly go back to the starting position.\nRepeat for the recommended amount of repetitions.', 'Tumbado en un banco inclinado con la cabeza hacia la polea baja, coge la barra con ambas manos en pronación (palmas hacia arriba) a la anchura de los hombros y estira los brazos sobre la cabeza. Flexiona los codos 90º tras la cabeza de forma controlada.', 'triceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Cable_Incline_Triceps_Extension/images/0.jpg', '/uploads/exercises/exercise_141.gif', NULL, '2026-07-13 22:23:41'),
(144, 'Cable Judo Flip', 'Crunch Diagonal en Polea', 'Connect a rope attachment to a tower, and move the cable to the lowest pulley position. Stand with your side to the cable with a wide stance, and grab the rope with both hands.\nTwist your body away from the pulley as you bring the rope over your shoulder like you\'re performing a judo flip.\nShift your weight between your feet as you twist and crunch forward, pulling the cable downward.\nReturn to the starting position and repeat until failure.\nThen, reposition and repeat the same series of movements on the opposite side.', 'De pie con la espalda recta y las piernas a la anchura aproximada de la cadera, ponte delante de la polea alta. Coge la cuerda con las dos manos a un lado de la cabeza, con los brazos flexionados hacia arriba. Flexiona el tronco lateralmente hacia abajo del lado contrario al de las manos, girando []', 'abdominals', 'Abdomen', 'Core/Abdomen', '[]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Cable_Judo_Flip/images/0.jpg', '/uploads/exercises/exercise_144.gif', NULL, '2026-07-13 22:23:41'),
(145, 'Cable Lying Triceps Extension', 'Press Francés con Polea', 'Lie on a flat bench and grasp the straight bar attachment of a low pulley with a narrow overhand grip. Tip: The easiest way to do this is to have someone hand you the bar as you lay down.\nWith your arms extended, position the bar over your torso. Your arms and your torso should create a 90-degree angle. This will be your starting position.\nLower the bar by bending at the elbow while keeping the upper arms stationary and elbows in. Go down until the bar lightly touches your forehead. Breathe in as you perform this portion of the movement.\nFlex the triceps as you lift the bar back to its starting position. Exhale as you perform this portion of the movement.\nHold for a second at the contracted position and repeat for the recommended amount of repetitions.', 'Tumbado con la cabeza hacia la polea baja, coge la barra con ambas manos en pronación (palmas hacia arriba) a la anchura de los hombros y estira los brazos frente al pecho. Flexiona los codos 90º sobre la cabeza de forma controlada.', 'triceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Cable_Lying_Triceps_Extension/images/0.jpg', '/uploads/exercises/exercise_145.gif', NULL, '2026-07-13 22:23:41'),
(147, 'Cable Preacher Curl', 'Curl en Banco Scott en Supinación con Polea', 'Place a preacher bench about 2 feet in front of a pulley machine.\nAttach a straight bar to the low pulley.\nSit at the preacher bench with your elbow and upper arms firmly on top of the bench pad and have someone hand you the bar from the low pulley.\nGrab the bar and fully extend your arms on top of the preacher bench pad. This will be your starting position.\nNow start pilling the weight up towards your shoulders and squeeze the biceps hard at the top of the movement. Exhale as you perform this motion. Also, hold for a second at the top.\nNow slowly lower the weight to the starting position.\nRepeat for the recommended amount of repetitions.', 'Sentado en el banco con el pecho apoyado, coge la polea con agarre en supinación (palmas hacia arriba). Apoya bien la parte trasera superior de los brazos en el banco scott y flexiona los codos subiendo la barra. Desciende lentamente sin llegar a estirar del todo.', 'biceps', 'Bíceps', 'Bíceps', '[\"Antebrazo\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Cable_Preacher_Curl/images/0.jpg', '/uploads/exercises/exercise_147.gif', NULL, '2026-07-13 22:23:41'),
(149, 'Cable Reverse Crunch', 'Crunch Inferior en Polea', 'Connect an ankle strap attachment to a low pulley cable and position a mat on the floor in front of it.\nSit down with your feet toward the pulley and attach the cable to your ankles.\nLie down, elevate your legs and bend your knees at a 90-degree angle. Your legs and the cable should be aligned. If not, adjust the pulley up or down until they are.\nWith your hands behind your head, bring your knees inward to your torso and elevate your hips off the floor.\nPause for a moment and in a slow and controlled manner drop your hips and bring your legs back to the starting 90-degree angle. You should still have tension on your abs in the resting position.\nRepeat the same movement to failure.', 'Tumbado hacia arriba en el suelo, con la espalda recta y brazos apoyados, agarra las correas de la polea baja en los pies. A continuación levanta las piernas totalmente rectas hacia arriba y flexiona las rodillas 90º. Esa es la posición inicial. Desde ahí y con las rodillas flexionadas, realiza el encogimiento del abdomen inferior, []', 'abdominals', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Cable_Reverse_Crunch/images/0.jpg', '/uploads/exercises/exercise_149.gif', NULL, '2026-07-13 22:23:41'),
(150, 'Cable Rope Overhead Triceps Extension', 'Extensión Vertical Neutra en Polea Baja', 'Attach a rope to the bottom pulley of the pulley machine.\nGrasping the rope with both hands, extend your arms with your hands directly above your head using a neutral grip (palms facing each other). Your elbows should be in close to your head and the arms should be perpendicular to the floor with the knuckles aimed at the ceiling. This will be your starting position.\nSlowly lower the rope behind your head as you hold the upper arms stationary. Inhale as you perform this movement and pause when your triceps are fully stretched.\nReturn to the starting position by flexing your triceps as you breathe out.\nRepeat for the recommended amount of repetitions.', 'De pie y de espaldas a la polea, coge la cuerda de la polea baja y estira los brazos sobre la cabeza. Desciende la polea por detrás de la cabeza flexionando los codos de forma controlada.', 'triceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Cable_Rope_Overhead_Triceps_Extension/images/0.jpg', '/uploads/exercises/exercise_150.gif', NULL, '2026-07-13 22:23:41'),
(152, 'Cable Russian Twists', 'Russian Twist en Fitball con Polea', 'Connect a standard handle attachment, and position the cable to a middle pulley position.\nLie on a stability ball perpendicular to the cable and grab the handle with one hand. You should be approximately arm\'s length away from the pulley, with the tension of the weight on the cable.\nGrab the handle with both hands and fully extend your arms above your chest. You hands should be directly in-line with the pulley. If not, adjust the pulley up or down until they are.\nKeep your hips elevated and abs engaged. Rotate your torso away from the pulley for a full-quarter rotation. Your body should be flat from head to knees.\nPause for a moment and in a slow and controlled manner reset to the starting position. You should still have side tension on the cable in the resting position.\nRepeat the same movement to failure.\nThen, reposition and repeat the same series of movements on the opposite side.', 'Túmbate con la espalda sobre un fitball con las piernas flexionadas y los pies en el suelo. Agarra el soporte de la polea alta con las dos manos, quedando este a un lado. Balanceándote, gira tu torso al lado contrario al de la polea, tirando del cable. Al terminar la serie, date la vuelta para []', 'abdominals', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Cable_Russian_Twists/images/0.jpg', '/uploads/exercises/exercise_152.gif', NULL, '2026-07-13 22:23:41'),
(153, 'Cable Seated Crunch', 'Crunch Superior sentado con Polea', 'Seat on a flat bench with your back facing a high pulley.\nGrasp the cable rope attachment with both hands (with the palms of the hands facing each other) and place your hands securely over both shoulders. Tip: Allow the weight to hyperextend the lower back slightly. This will be your starting position.\nWith the hips stationary, flex the waist so the elbows travel toward the hips. Breathe out as you perform this step.\nAs you inhale, go back to the initial position slowly.\nRepeat for the recommended amount of repetitions.', 'Sentado en un banco o similar, de espaldas a la polea alta, coge la cuerda y ponla tras tu cabeza, con una mano agarrando cada extremo. Encoge el torso mediante la contracción de los abdominales superiores, sin tirar del cuello ni los brazos.', 'abdominals', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Cable_Seated_Crunch/images/0.jpg', '/uploads/exercises/exercise_153.gif', NULL, '2026-07-13 22:23:41'),
(155, 'Cable Shoulder Press', 'Press Militar Neutro Alterno en Polea', 'Move the cables to the bottom of the towers and select an appropriate weight.\nStand directly in between the uprights. Grasp the cables and hold them at shoulder height, palms facing forward. This will be your starting position.\nKeeping your head and chest up, extend through the elbow to press the handles directly over head.\nAfter pausing at the top, return to the starting position and repeat.', 'De pie entre dos poleas con la espalda recta y las piernas a la anchura de los hombros, coge una polea baja con cada mano y ponlas a los lados de la cabeza con los brazos flexionados y con agarre neutro (palmas hacia dentro). Levanta una mano hacia arriba estirando bien el brazo y vuelve []', 'shoulders', 'Hombro', 'Hombros', '[\"Tríceps\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Cable_Shoulder_Press/images/0.jpg', '/uploads/exercises/exercise_155.gif', NULL, '2026-07-13 22:23:41');
INSERT INTO `exercises` (`id`, `name`, `name_es`, `description`, `description_es`, `target_muscle`, `target_muscle_es`, `primary_muscle`, `secondary_muscles`, `is_warmup`, `media_type`, `media_url`, `local_media_path`, `created_by_trainer_id`, `created_at`) VALUES
(157, 'Cable Wrist Curl', 'Curl Concentrado en Supinación con Polea', 'Start out by placing a flat bench in front of a low pulley cable that has a straight bar attachment.\nUse your arms to grab the cable bar with a narrow to shoulder width supinated grip (palms up) and bring them up so that your forearms are resting against the top of your thighs. Your wrists should be hanging just beyond your knees.\nStart out by curling your wrist upwards and exhaling. Keep the contraction for a second.\nSlowly lower your wrists back down to the starting position while inhaling.\nYour forearms should be stationary as your wrist is the only movement needed to perform this exercise.\nRepeat for the recommended amount of repetitions.', 'Sentado, con los antebrazos apoyados sobre las rodillas o el banco y las palmas de las manos mirando hacia arriba, sujetar firmemente la barra de la polea y realizar el movimiento de subida y bajada de las muñecas, sin despegar los antebrazos del apoyo.', 'forearms', 'Antebrazo', 'Antebrazo', '[]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Cable_Wrist_Curl/images/0.jpg', '/uploads/exercises/exercise_157.gif', NULL, '2026-07-13 22:23:41'),
(184, 'Chin-Up', 'Dominada en Supinación', 'Grab the pull-up bar with the palms facing your torso and a grip closer than the shoulder width.\nAs you have both arms extended in front of you holding the bar at the chosen grip width, keep your torso as straight as possible while creating a curvature on your lower back and sticking your chest out. This is your starting position. Tip: Keeping the torso as straight as possible maximizes biceps stimulation while minimizing back involvement.\nAs you breathe out, pull your torso up until your head is around the level of the pull-up bar. Concentrate on using the biceps muscles in order to perform the movement. Keep the elbows close to your body. Tip: The upper torso should remain stationary as it moves through space and only the arms should move. The forearms should do no other work other than hold the bar.\nAfter a second of squeezing the biceps in the contracted position, slowly lower your torso back to the starting position; when your arms are fully extended. Breathe in as you perform this portion of the movement.\nRepeat this motion for the prescribed amount of repetitions.', 'Colgado en una barra de dominadas con las manos a la anchura de los hombros y las palmas hacia atrás, sube el cuerpo mediante la flexión de los brazos hasta pasar la cabeza sobre la barra. Desciende lentamente.', 'lats', 'Espalda', 'Bíceps', '[\"Espalda\"]', 1, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Chin-Up/images/0.jpg', '/uploads/exercises/exercise_184.gif', NULL, '2026-07-13 22:23:41'),
(195, 'Close-Grip Barbell Bench Press', 'Press Cerrado con Barra', 'Lie back on a flat bench. Using a close grip (around shoulder width), lift the bar from the rack and hold it straight over you with your arms locked. This will be your starting position.\nAs you breathe in, come down slowly until you feel the bar on your middle chest. Tip: Make sure that - as opposed to a regular bench press - you keep the elbows close to the torso at all times in order to maximize triceps involvement.\nAfter a second pause, bring the bar back to the starting position as you breathe out and push the bar using your triceps muscles. Lock your arms in the contracted position, hold for a second and then start coming down slowly again. Tip: It should take at least twice as long to go down than to come up.\nRepeat the movement for the prescribed amount of repetitions.\nWhen you are done, place the bar back in the rack.', 'Tumbado hacia arriba en un banco, coge la barra con las manos en pronación (palmas hacia los pies) a la altura del pecho y a una anchura inferior a la de los hombros (una mano delante de cada pectoral). Estira los brazos tensando bien los tríceps, sin abrir los codos. Desciende nuevamente y mantén los []', 'triceps', 'Tríceps', 'Tríceps', '[\"Pecho\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Close-Grip_Barbell_Bench_Press/images/0.jpg', '/uploads/exercises/exercise_195.gif', NULL, '2026-07-13 22:23:41'),
(196, 'Close-Grip Dumbbell Press', 'Press Militar en Supinación con Mancuernas', 'Place a dumbbell standing up on a flat bench.\nEnsuring that the dumbbell stays securely placed at the top of the bench, lie perpendicular to the bench with only your shoulders lying on the surface. Hips should be below the bench and your legs bent with your feet firmly on the floor.\nGrasp the dumbbell with both hands and hold it straight over your chest at arm\'s length. Both palms should be pressing against the underside of the sides of the dumbbell. This will be your starting position.\nInitiate the movement by lowering the dumbbell to your chest.\nReturn to the starting position by extending the elbows.', 'Sentado en un banco con el respaldo recto, coge una mancuerna con cada mano y ponlas frente al pecho con los codos flexionados y con agarre en supinación (palmas hacia el cuerpo). Levanta las mancuernas hacia arriba estirando bien los brazos y vuelve a bajar de forma controlada.', 'triceps', 'Hombro', 'Hombros', '[\"Tríceps\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Close-Grip_Dumbbell_Press/images/0.jpg', '/uploads/exercises/exercise_196.gif', NULL, '2026-07-13 22:23:41'),
(198, 'Close-Grip EZ-Bar Press', 'Press Banca Cerrado con Barra', 'Lie on a flat bench with an EZ bar loaded to an appropriate weight.\nUsing a narrow grip lift the bar and hold it straight over your torso with your elbows in. The arms should be perpendicular to the floor. This will be your starting position.\nNow lower the bar down to your lower chest as you breathe in. Keep the elbows in as you perform this movement.\nUsing the triceps to push the bar back up, press it back to the starting position by extending the elbows as you exhale.\nRepeat.', 'Tumbado sobre un banco horizontal, los brazos estirados verticalmente, agarramos la barra con las manos en pronación por la parte más interna de la barra z (recomendable está barra para no dañar las muñecas). El movimiento consiste en bajar la barra hasta el pecho, sin descansar abajo, y luego subir hasta la posición inicial​. La []', 'triceps', 'Pecho', 'Pecho', '[\"Tríceps\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Close-Grip_EZ-Bar_Press/images/0.jpg', '/uploads/exercises/exercise_198.gif', NULL, '2026-07-13 22:23:41'),
(200, 'Close-Grip Front Lat Pulldown', 'Jalón Cerrado en Pronación en Polea Alta', 'Sit down on a pull-down machine with a wide bar attached to the top pulley. Make sure that you adjust the knee pad of the machine to fit your height. These pads will prevent your body from being raised by the resistance attached to the bar.\nGrab the bar with the palms facing forward using the prescribed grip. Note on grips: For a wide grip, your hands need to be spaced out at a distance wider than your shoulder width. For a medium grip, your hands need to be spaced out at a distance equal to your shoulder width and for a close grip at a distance smaller than your shoulder width.\nAs you have both arms extended in front of you - while holding the bar at the chosen grip width - bring your torso back around 30 degrees or so while creating a curvature on your lower back and sticking your chest out. This is your starting position.\nAs you breathe out, bring the bar down until it touches your upper chest by drawing the shoulders and the upper arms down and back. Tip: Concentrate on squeezing the back muscles once you reach the full contracted position. The upper torso should remain stationary (only the arms should move). The forearms should do no other work except for holding the bar; therefore do not try to pull the bar down using the forearms.\nAfter a second in the contracted position, while squeezing your shoulder blades together, slowly raise the bar back to the starting position when your arms are fully extended and the lats are fully stretched. Inhale during this portion of the movement.\n6. Repeat this motion for the prescribed amount of repetitions.', 'Sentado de cara a la polea con la espalda recta, estira los brazos hacia arriba y coge la barra con las manos a una anchura inferior a la de los hombros y las manos hacia delante. Flexiona los brazos llevando los codos a los costados y bajando la barra hasta el pecho. Estira de nuevo []', 'lats', 'Espalda', 'Espalda', '[\"Dorsal\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Close-Grip_Front_Lat_Pulldown/images/0.jpg', '/uploads/exercises/exercise_200.gif', NULL, '2026-07-13 22:23:41'),
(201, 'Close-Grip Push-Up off of a Dumbbell', 'Flexiones Cerradas', 'Lie on the floor and place your hands on an upright dumbbell. Supporting your weight on your toes and hands, keep your torso rigid and your elbows in with your arms straight. This will be your starting position.\nLower your body, allowing the elbows to flex while you inhale. Keep your body straight, not allowing your hips to rise or sag.\nPress yourself back up to the starting position by extending the elbows. Breathe out as you perform this step.\nAfter a pause at the contracted position, repeat the movement for the prescribed amount of repetitions.', 'Empezamos en posición de plancha con las manos apoyadas a la altura del pecho, a una anchura inferior a la de los hombros (delante del pecho). Subimos estirando los brazos con los codos en ángulo, estirando bien arriba. Bajamos a la posición inicial sin descansar abajo. Los brazos volverán a estar en ángulo como al []', 'triceps', 'Pecho', 'Tríceps', '[\"Pecho\"]', 1, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Close-Grip_Push-Up_off_of_a_Dumbbell/images/0.jpg', '/uploads/exercises/exercise_201.gif', NULL, '2026-07-13 22:23:41'),
(202, 'Close-Grip Standing Barbell Curl', 'Curl en Supinación Cerrado con Barra', 'Hold a barbell with both hands, palms up and a few inches apart.\nStand with your torso straight and your head up. Your feet should be about shoulder width and your elbows close to your torso. This will be your starting position. Tip: You will keep your upper arms and elbows stationary throughout the movement.\nCurl the bar up in a semicircular motion until the forearms touch your biceps. Exhale as you perform this portion of the movement and contract your biceps hard for a second at the top. Tip: Avoid bending the back or using swinging motions as you lift the weight. Only the forearms should move.\nSlowly go back down to the starting position as you inhale.\nRepeat for the recommended amount of repetitions.', 'De pie con la espalda recta y las piernas ligeramente separadas, coge la barra con las manos a una anchura inferior a la de los hombros, con las palmas hacia arriba (supinación). Sube la barra flexionando los codos y desciende de forma controlada.', 'biceps', 'Bíceps', 'Bíceps', '[\"Antebrazo\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Close-Grip_Standing_Barbell_Curl/images/0.jpg', '/uploads/exercises/exercise_202.gif', NULL, '2026-07-13 22:23:41'),
(203, 'Cocoons', 'Cocoons', 'Begin by lying on your back on the ground. Your legs should be straight and your arms extended behind your head. This will be your starting position.\nTo perform the movement, tuck the knees toward your chest, rotating your pelvis to lift your glutes from the floor. As you do so, flex the spine, bringing your arms back over your head to perform a simultaneous crunch motion.\nAfter a brief pause, return to the starting position.', 'Acuéstate boca arriba con los brazos extendidos a lo largo del cuerpo y las palmas hacia abajo. Levanta las piernas y el torso del suelo al mismo tiempo, manteniendo los brazos rectos y extendidos hacia adelante. A continuación, lleva las rodillas hacia el pecho mientras te enrollas hacia adelante, tocando tus rodillas con la barbilla []', 'abdominals', 'Abdomen', 'Core/Abdomen', '[]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Cocoons/images/0.jpg', '/uploads/exercises/exercise_203.gif', NULL, '2026-07-13 22:23:41'),
(206, 'Cross-Body Crunch', 'Crunch Cruzado', 'Lie flat on your back and bend your knees about 60 degrees.\nKeep your feet flat on the floor and place your hands loosely behind your head. This will be your starting position.\nNow curl up and bring your right elbow and shoulder across your body while bring your left knee in toward your left shoulder at the same time. Reach with your elbow and try to touch your knee. Exhale as you perform this movement. Tip: Try to bring your shoulder up towards your knee rather than just your elbow and remember that the key is to contract the abs as you perform the movement; not just to move the elbow.\nNow go back down to the starting position as you inhale and repeat with the left elbow and the right knee.\nContinue alternating in this manner until all prescribed repetitions are done.', 'Acuéstate boca arriba con las rodillas dobladas y los pies apoyados en el suelo. Coloca las manos detrás de la cabeza, sin entrelazar los dedos. Levanta los hombros del suelo mientras contraes los abdominales. A medida que subes, gira el torso y lleva el codo derecho hacia la rodilla izquierda, levantando también esa pierna del []', 'abdominals', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Cross-Body_Crunch/images/0.jpg', '/uploads/exercises/exercise_206.gif', NULL, '2026-07-13 22:23:41'),
(208, 'Cross Body Hammer Curl', 'Curl en Martillo Alterno con Mancuernas', 'Stand up straight with a dumbbell in each hand. Your hands should be down at your side with your palms facing in.\nWhile keeping your palms facing in and without twisting your arm, curl the dumbbell of the right arm up towards your left shoulder as you exhale. Touch the top of the dumbbell to your shoulder and hold the contraction for a second.\nSlowly lower the dumbbell along the same path as you inhale and then repeat the same movement for the left arm.\nContinue alternating in this fashion until the recommended amount of repetitions is performed for each arm.', 'De pie con la espalda recta y las piernas ligeramente separadas, coge una mancuerna con cada mano y con la palma hacia el cuerpo (agarre neutro). Flexiona un codo llevando la mancuerna a la altura del pecho. Mientras desciende, sube la otra mancuerna.', 'biceps', 'Bíceps', 'Braquial', '[\"Bíceps\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Cross_Body_Hammer_Curl/images/0.jpg', '/uploads/exercises/exercise_208.gif', NULL, '2026-07-13 22:23:41'),
(222, 'Decline Dumbbell Bench Press', 'Press Declinado con Mancuernas', 'Secure your legs at the end of the decline bench and lie down with a dumbbell on each hand on top of your thighs. The palms of your hand will be facing each other.\nOnce you are laying down, move the dumbbells in front of you at shoulder width.\nOnce at shoulder width, rotate your wrists forward so that the palms of your hands are facing away from you. This will be your starting position.\nBring down the weights slowly to your side as you breathe out. Keep full control of the dumbbells at all times. Tip: Throughout the motion, the forearms should always be perpendicular to the floor.\nAs you breathe out, push the dumbbells up using your pectoral muscles. Lock your arms in the contracted position, squeeze your chest, hold for a second and then start coming down slowly. Tip: It should take at least twice as long to go down than to come up..\nRepeat the movement for the prescribed amount of repetitions of your training program.', 'Túmbate de espaldas en el banco declinado y coge las mancuernas con agarre en pronación (palmas hacia los pies), directamente sobre los hombros con los brazos totalmente extendidos. Las mancuernas no deben estar en contacto, si no una sobre cada pectoral. Junta los omóplatos y saca pecho ligeramente. Baja las mancuernas a ambos lados del []', 'chest', 'Pecho', 'Pecho', '[\"Tríceps\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Decline_Dumbbell_Bench_Press/images/0.jpg', '/uploads/exercises/exercise_222.gif', NULL, '2026-07-13 22:23:41'),
(224, 'Decline Dumbbell Triceps Extension', 'Extensión Declinada con Mancuernas', 'Secure your legs at the end of the decline bench and lie down with a dumbbell on each hand on top of your thighs. The palms of your hand will be facing each other.\nOnce you are laying down, move the dumbbells in front of you at shoulder width. The palms of the hands should be facing each other and the arms should be perpendicular to the floor and fully extended. This will be your starting position.\nAs you breathe in and you keep the upper arms stationary (and elbows in), bring the dumbbells down slowly by moving your forearms in a semicircular motion towards you until your thumbs are next to your ears. Breathe in as you perform this portion of the movement.\nLift the dumbbells back to the starting position by contracting the triceps and exhaling.\nRepeat for the recommended amount of repetitions.', 'Tumbado hacia arriba en un banco declinado, coge las mancuernas con agarre neutro (palmas hacia el interior), frente al pecho y estira los brazos. Flexiona los codos ligeramente mientras desciendes las mancuernas hasta llegar detrás de la cabeza. Vuelve a la posición inicial con el movimiento controlado.', 'triceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Decline_Dumbbell_Triceps_Extension/images/0.jpg', '/uploads/exercises/exercise_224.gif', NULL, '2026-07-13 22:23:41'),
(227, 'Decline Push-Up', 'Flexiones Declinadas', 'Lie on the floor face down and place your hands about 36 inches apart while holding your torso up at arms length. Move your feet up to a box or bench. This will be your starting position.\nNext, lower yourself downward until your chest almost touches the floor as you inhale.\nNow breathe out and press your upper body back up to the starting position while squeezing your chest.\nAfter a brief pause at the top contracted position, you can begin to lower yourself downward again for as many repetitions as needed.', 'Empezamos en posición de plancha con las manos apoyadas a la altura del pecho, a la anchura de los hombros. Ponemos los pies en alto, sobre un banco, silla o cualquier otro elemento. Subimos estirando los brazos con los codos en ángulo, estirando bien arriba. Bajamos a la posición inicial sin descansar abajo. Los brazos []', 'chest', 'Pecho', 'Tríceps', '[\"Pecho\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Decline_Push-Up/images/0.jpg', '/uploads/exercises/exercise_227.gif', NULL, '2026-07-13 22:23:41'),
(235, 'Donkey Calf Raises', 'Extensión de Gemelos de pie', 'For this exercise you will need access to a donkey calf raise machine. Start by positioning your lower back and hips under the padded lever provided. The tailbone area should be the one making contact with the pad.\nPlace both of your arms on the side handles and place the balls of your feet on the calf block with the heels extending off. Align the toes forward, inward or outward, depending on the area you wish to target, and straighten the knees without locking them. This will be your starting position.\nRaise your heels as you breathe out by extending your ankles as high as possible and flexing your calf. Ensure that the knee is kept stationary at all times. There should be no bending at any time. Hold the contracted position by a second before you start to go back down.\nGo back slowly to the starting position as you breathe in by lowering your heels as you bend the ankles until calves are stretched.\nRepeat for the recommended amount of repetitions.', 'Pon la parte delantera de los pies al borde de un step o plataforma. Puedes ponerte de pie con las manos en algún soporte o pared o inclinarte hacia delante con las manos en un banco o similar. Ponte de puntillas estirando bien los gemelos y desciende, repetidamente hasta terminar la serie.', 'calves', 'Pierna', 'Gemelos', '[]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Donkey_Calf_Raises/images/0.jpg', '/uploads/exercises/exercise_235.gif', NULL, '2026-07-13 22:23:41'),
(246, 'Dumbbell Bench Press', 'Press Banca con giro con Mancuernas', 'Lie down on a flat bench with a dumbbell in each hand resting on top of your thighs. The palms of your hands will be facing each other.\nThen, using your thighs to help raise the dumbbells up, lift the dumbbells one at a time so that you can hold them in front of you at shoulder width.\nOnce at shoulder width, rotate your wrists forward so that the palms of your hands are facing away from you. The dumbbells should be just to the sides of your chest, with your upper arm and forearm creating a 90 degree angle. Be sure to maintain full control of the dumbbells at all times. This will be your starting position.\nThen, as you breathe out, use your chest to push the dumbbells up. Lock your arms at the top of the lift and squeeze your chest, hold for a second and then begin coming down slowly. Tip: Ideally, lowering the weight should take about twice as long as raising it.\nRepeat the movement for the prescribed amount of repetitions of your training program.', 'Tumbado de espaldas en un banco, sujeta un par de mancuernas justo por encima del esternón con los brazos totalmente estirados. Junta los omóplatos, saca un poco el pecho y pon las palmas de las manos hacia delante. Baja despacio las mancuernas a los costados del pecho mientras giras las muñecas de forma que las []', 'chest', 'Tríceps', 'Pecho', '[\"Tríceps\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Dumbbell_Bench_Press/images/0.jpg', '/uploads/exercises/exercise_246.gif', NULL, '2026-07-13 22:23:41'),
(247, 'Dumbbell Bench Press with Neutral Grip', 'Press Francés con Mancuernas', 'Take a dumbbell in each hand and lay back onto a flat bench. Your feet should be flat on the floor and your shoulder blades retracted.\nMaintaining a neutral grip, palms facing each other, begin with your arms extended directly above you, perpendicular to the floor. This will be your starting position.\nBegin the movement by flexing the elbow, lowering the upper arms to the side. Descend until the dumbbells are to your torso.\nPause, then extend the elbow and return to the starting position.', 'Tumbado hacia arriba en un banco plano, coge una mancuerna con cada mano, con las palmas hacia el interior (agarre neutro) a la altura del pecho y a la anchura de los hombros (una mano delante de cada pectoral). Estira los brazos tensando bien los tríceps, sin abrir los codos. Desciende las mancuernas flexionando los []', 'chest', 'Tríceps', 'Tríceps', '[]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Dumbbell_Bench_Press_with_Neutral_Grip/images/0.jpg', '/uploads/exercises/exercise_247.gif', NULL, '2026-07-13 22:23:41'),
(252, 'Dumbbell Incline Row', 'Remo Inclinado en Pronación con Mancuernas', 'Using a neutral grip, lean into an incline bench.\nTake a dumbbell in each hand with a neutral grip, beginning with the arms straight. This will be your starting position.\nRetract the shoulder blades and flex the elbows to row the dumbbells to your side.\nPause at the top of the motion, and then return to the starting position.', 'Apoyando el pecho en el respaldo de un banco inclinado, sostén una mancuerna con cada mano con agarre en pronación (palmas hacia abajo). Coge aire mientras levantas las mancuernas hasta la altura del respaldo, con contracción escapular y aguantando un segundo arriba. Después desciende de forma controlada. Separa los codos del cuerpo en la subida.', 'middle back', 'Espalda', 'Espalda', '[\"Hombros\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Dumbbell_Incline_Row/images/0.jpg', '/uploads/exercises/exercise_252.gif', NULL, '2026-07-13 22:23:41'),
(253, 'Dumbbell Incline Shoulder Raise', 'Elevaciones Frontales Inclinadas con giro con Mancuernas', 'Sit on an Incline Bench while holding a dumbbell on each hand on top of your thighs.\nLift your legs up to kick the weights to your shoulders and lean back. Position the dumbbells above your shoulders with your arms extended. The arms should be perpendicular to the floor with your palms facing forward and knuckles pointing towards the ceiling. This will be your starting position.\nWhile keeping the arms straight and locked, lift the dumbbells by raising the shoulders from the bench as you breathe out.\nBring back the dumbbells to the starting position as you breathe in.\nRepeat for the recommended amount of repetitions.', 'Tumbado hacia arriba en un banco inclinado, deja caer los brazos a los lados y coge las mancuernas con las manos en agarre neutro (palmas hacia dentro). Con los brazos estirados, eleva las mancuernas frontalmente hasta tenerlas a la altura de los hombros, girando las muñecas de forma que queden en pronación (palmas hacia abajo) []', 'shoulders', 'Hombro', 'Hombros', '[\"Pecho\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Dumbbell_Incline_Shoulder_Raise/images/0.jpg', '/uploads/exercises/exercise_253.gif', NULL, '2026-07-13 22:23:41'),
(255, 'Dumbbell Lying One-Arm Rear Lateral Raise', 'Pájaros Aislados con Mancuerna', 'While holding a dumbbell in one hand, lay with your chest down on a slightly inclined (around 15 degrees when measured from the floor) adjustable bench. The other hand can be used to hold to the leg of the bench for stability.\nPosition the palm of the hand that is holding the dumbbell in a neutral manner (palms facing your torso) as you keep the arm extended with the elbow slightly bent. This will be your starting position.\nNow raise the arm with the dumbbell to the side until your elbow is at shoulder height and your arm is roughly parallel to the floor as you exhale. Tip: Maintain your arm perpendicular to the torso while keeping your arm extended throughout the movement. Also, keep the contraction at the top for a second.\nSlowly lower the dumbbell to the starting position as you inhale.\nRepeat for the recommended amount of repetitions.', 'Tumbado hacia abajo en un banco plano, coge una mancuerna con una mano y usa la otra para estabilizarte. Con el codo levemente flexionado, levanta simultáneamente el peso lateralmente. Debes tratar que tanto el codo como la palma de la mano vayan alineados, sin meter ningún tipo de tirón. El codo no deben subir más []', 'shoulders', 'Hombro', 'Hombros', '[]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Dumbbell_Lying_One-Arm_Rear_Lateral_Raise/images/0.jpg', '/uploads/exercises/exercise_255.gif', NULL, '2026-07-13 22:23:41'),
(257, 'Dumbbell Lying Rear Lateral Raise', 'Pájaros de pie con Mancuernas', 'While holding a dumbbell in each hand, lay with your chest down on a slightly inclined (around 15 degrees when measured from the floor) adjustable bench.\nPosition the palms of the hands in a neutral manner (palms facing your torso) as you keep the arms extended with the elbows slightly bent. This will be your starting position.\nNow raise the arms to the side until your elbows are at shoulder height and your arms are roughly parallel to the floor as you exhale. Tip: Maintain your arms perpendicular to the torso while keeping them extended throughout the movement. Also, keep the contraction at the top for a second.\nSlowly lower the dumbbells to the starting position as you inhale.\nRepeat for the recommended amount of repetitions and then switch to the other arm.', 'De pie con las piernas ligeramente separadas y semiflexionadas, inclina el cuerpo hacia delante y coge una mancuerna con cada mano con las palmas enfrentadas. A continuación, junta ambas mancuernas y con los codos levemente flexionados, levanta simultáneamente el peso lateralmente. Debes tratar que tanto los codos como la palma de la mano vayan alineados, []', 'shoulders', 'Hombro', 'Hombros', '[\"Espalda\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Dumbbell_Lying_Rear_Lateral_Raise/images/0.jpg', '/uploads/exercises/exercise_257.gif', NULL, '2026-07-13 22:23:41'),
(260, 'Dumbbell One-Arm Triceps Extension', 'Extensión Vertical Aislada con Mancuerna', 'Grab a dumbbell and either sit on a military press bench or a utility bench that has a back support on it as you place the dumbbells upright on top of your thighs or stand up straight.\nClean the dumbbell up to bring it to shoulder height and then extend the arm over your head so that the whole arm is perpendicular to the floor and next to your head. The dumbbell should be on top of you. The other hand can be kept fully extended to the side, by the waist, supporting the upper arm that has the dumbbell or grabbing a fixed surface.\nRotate the wrist so that the palm of your hand is facing forward and the pinkie is facing the ceiling. This will be your starting position.\nSlowly lower the dumbbell behind your head as you hold the upper arm stationary. Inhale as you perform this movement and pause when your triceps are fully stretched.\nReturn to the starting position by flexing your triceps as you breathe out. Tip: It is imperative that only the forearm moves. The upper arm should remain at all times stationary next to your head.\nRepeat for the recommended amount of repetitions and switch arms.', 'Sentado con la espalda recta, coge la mancuerna con agarre neutro (palma hacia el interior) y estira el brazo sobre la cabeza. Desciende la mancuerna por detrás de la cabeza flexionando el codo 90º, de forma controlada. Estira volviendo a la posición inicial. Puedes utilizar la otra mano para ejercer de apoyo o tope, colocándola []', 'triceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Dumbbell_One-Arm_Triceps_Extension/images/0.jpg', '/uploads/exercises/exercise_260.gif', NULL, '2026-07-13 22:23:41'),
(263, 'Dumbbell Raise', 'Encogimientos Laterales con Mancuernas', 'Grab a dumbbell in each arm and stand up straight with your arms extended by your sides with a slight bend at the elbows and your back straight. This will be your starting position. Tip: The dumbbell should be next to your thighs with the palm of your hands facing back.\nUse your side shoulders to lift the dumbbells as you exhale. The dumbbells should be to the side of the body as you move them up. Continue to lift it until the dumbbells are nearly in line with your chin. Tip: Your elbows should drive the motion. As you lift the dumbbell, your elbow should always be higher than your forearm. Also, keep your torso stationary and pause for a second at the top of the movement.\nLower the dumbbells back down slowly to the starting position. Inhale as you perform this portion of the movement.\nRepeat for the recommended amount of repetitions.', 'De pie con las piernas ligeramente separadas y la espalda recta, coge una con cada mano a los lados del cuerpo y las palmas hacia dentro. Flexiona los codos hacia fuera subiendo las mancuernas a los costados del pecho, y baja de forma controlada.', 'shoulders', 'Hombro', 'Trapecio', '[\"Hombros\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Dumbbell_Raise/images/0.jpg', '/uploads/exercises/exercise_263.gif', NULL, '2026-07-13 22:23:41'),
(264, 'Dumbbell Rear Lunge', 'Zancada Trasera con Mancuernas', 'Stand with your torso upright holding two dumbbells in your hands by your sides. This will be your starting position.\nStep backward with your right leg around two feet or so from the left foot and lower your upper body down, while keeping the torso upright and maintaining balance. Inhale as you go down. Tip: As in the other exercises, do not allow your knee to go forward beyond your toes as you come down, as this will put undue stress on the knee joint. Make sure that you keep your front shin perpendicular to the ground. Keep the torso upright during the lunge; flexible hip flexors are important. A long lunge emphasizes the Gluteus Maximus; a short lunge emphasizes Quadriceps.\nPush up and go back to the starting position as you exhale. Tip: Use the ball of your feet to push in order to accentuate the quadriceps. To focus on the glutes, press with your heels.\nNow repeat with the opposite leg.', 'De pie con las piernas a la anchura de los hombros y la espalda recta, coge una mancuerna con cada mano a los lados del cuerpo. Da una zancada hacia atrás, flexionando la pierna de apoyo 90° y la otra de forma que quede la rodilla cerca del suelo. Vuelve a la posición inicial. Puedes []', 'quadriceps', 'Pierna', 'Glúteo', '[\"Cuádriceps\"]', 1, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Dumbbell_Rear_Lunge/images/0.jpg', '/uploads/exercises/exercise_264.gif', NULL, '2026-07-13 22:23:41'),
(267, 'Dumbbell Seated One-Leg Calf Raise', 'Extensión de Gemelo Aislado sentado con Mancuerna', 'Place a block on the floor about 12 inches from a flat bench.\nSit on a flat bench and place a dumbbell on your upper left thigh about 3 inches above your knee.\nNow place the ball of your left foot on the block. This will be your starting position.\nRaise your toes up as high as possible as you exhale and you contract your calf muscle. Hold the contraction for a second.\nSlowly return to the starting position, stretching as far down as possible.\nRepeat for your prescribed number of repetitions and then repeat with the right leg.', 'Sentado en un banco o similar, pon la parte delantera de un pie sobre una plataforma como puede ser un step o un disco. La otra pierna ponla hacia atrás y coge una mancuerna sobre el muslo de la pierna a trabajar. Ponte de puntillas estirando bien el gemelo y desciende, repetidamente hasta terminar la []', 'calves', 'Pierna', 'Gemelos', '[]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Dumbbell_Seated_One-Leg_Calf_Raise/images/0.jpg', '/uploads/exercises/exercise_267.gif', NULL, '2026-07-13 22:23:41'),
(269, 'Dumbbell Shrug', 'Encogimientos con Mancuernas', 'Stand erect with a dumbbell on each hand (palms facing your torso), arms extended on the sides.\nLift the dumbbells by elevating the shoulders as high as possible while you exhale. Hold the contraction at the top for a second. Tip: The arms should remain extended at all times. Refrain from using the biceps to help lift the dumbbells. Only the shoulders should be moving up and down.\nLower the dumbbells back to the original position.\nRepeat for the recommended amount of repetitions.', 'De pie con las piernas ligeramente separadas y la espalda recta, coge una mancuerna con cada mano a los lados del cuerpo y las palmas hacia dentro. Encoge los hombros sin flexionar los brazos, subiendo y bajando el peso exclusivamente con el trapecio.', 'traps', 'Hombro', 'Trapecio', '[]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Dumbbell_Shrug/images/0.jpg', '/uploads/exercises/exercise_269.gif', NULL, '2026-07-13 22:23:41'),
(270, 'Dumbbell Side Bend', 'Crunch Lateral con Mancuerna', 'Stand up straight while holding a dumbbell on the left hand (palms facing the torso) as you have the right hand holding your waist. Your feet should be placed at shoulder width. This will be your starting position.\nWhile keeping your back straight and your head up, bend only at the waist to the right as far as possible. Breathe in as you bend to the side. Then hold for a second and come back up to the starting position as you exhale. Tip: Keep the rest of the body stationary.\nNow repeat the movement but bending to the left instead. Hold for a second and come back to the starting position.\nRepeat for the recommended amount of repetitions and then change hands.', 'De pie con la espalda recta y las piernas a la anchura aproximada de la cadera, sujeta la mancuerna con una mano. Flexiona el tronco lateralmente, sin inclinarte hacia delante ni hacia atrás. Baja la mancuerna, sin hacer fuerza con el brazo, deja el peso \"muerto\". Vuelve a la posición inicial sin movimientos bruscos.', 'abdominals', 'Abdomen', 'Oblicuos', '[]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Dumbbell_Side_Bend/images/0.jpg', '/uploads/exercises/exercise_270.gif', NULL, '2026-07-13 22:23:41'),
(271, 'Dumbbell Squat', 'Cuarto de Sentadilla con Mancuernas', 'Stand up straight while holding a dumbbell on each hand (palms facing the side of your legs).\nPosition your legs using a shoulder width medium stance with the toes slightly pointed out. Keep your head up at all times as looking down will get you off balance and also maintain a straight back. This will be your starting position. Note: For the purposes of this discussion we will use the medium stance described above which targets overall development; however you can choose any of the three stances discussed in the foot stances section.\nBegin to slowly lower your torso by bending the knees as you maintain a straight posture with the head up. Continue down until your thighs are parallel to the floor. Tip: If you performed the exercise correctly, the front of the knees should make an imaginary straight line with the toes that is perpendicular to the front. If your knees are past that imaginary line (if they are past your toes) then you are placing undue stress on the knee and the exercise has been performed incorrectly.\nBegin to raise your torso as you exhale by pushing the floor with the heel of your foot mainly as you straighten the legs again and go back to the starting position.\nRepeat for the recommended amount of repetitions.', 'De pie con la espalda recta y con las piernas separadas a la anchura de los hombros, coge una mancuerna con cada mano. Desciende flexionando las rodillas ligeramente, aproximadamente a 45º. Sube de nuevo estirando bien arriba.', 'quadriceps', 'Pierna', 'Cuádriceps', '[\"Glúteo\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Dumbbell_Squat/images/0.jpg', '/uploads/exercises/exercise_271.gif', NULL, '2026-07-13 22:23:41'),
(272, 'Dumbbell Squat To A Bench', 'Media Sentadilla con Mancuernas', 'Stand up straight with a flat bench behind you while holding a dumbbell on each hand (palms facing the side of your legs).\nPosition your legs using a shoulder width medium stance with the toes slightly pointed out. Keep your head up at all times as looking down will get you off balance and also maintain a straight back. This will be your starting position. Note: For the purposes of this discussion we will use the medium stance described above which targets overall development; however you can choose any of the three stances discussed in the foot stances section.\nBegin to slowly lower your torso by bending the knees as you maintain a straight posture with the head up. Continue down until you slightly touch the bench behind you. Inhale as you perform this portion of the movement. Tip: If you performed the exercise correctly, the front of the knees should make an imaginary straight line with the toes that is perpendicular to the front. If your knees are past that imaginary line (if they are past your toes) then you are placing undue stress on the knee and the exercise has been performed incorrectly.\nBegin to raise the bar as you exhale by pushing the floor with the heel of your foot mainly as you straighten the legs again and go back to the starting position.\nRepeat for the recommended amount of repetitions.', 'De pie delante de un banco o silla, con las piernas separadas a la anchura de los hombros y una barra mancuerna en cada mano. Desciende flexionando las rodillas 90º hasta tocar el banco con los glúteos, sin descansar en él, subiendo de nuevo y estirando bien arriba.', 'quadriceps', 'Pierna', 'Cuádriceps', '[\"Gemelos\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Dumbbell_Squat_To_A_Bench/images/0.jpg', '/uploads/exercises/exercise_272.gif', NULL, '2026-07-13 22:23:41'),
(273, 'Dumbbell Step Ups', 'Step Up con Mancuernas', 'Stand up straight while holding a dumbbell on each hand (palms facing the side of your legs).\nPlace the right foot on the elevated platform. Step on the platform by extending the hip and the knee of your right leg. Use the heel mainly to lift the rest of your body up and place the foot of the left leg on the platform as well. Breathe out as you execute the force required to come up.\nStep down with the left leg by flexing the hip and knee of the right leg as you inhale. Return to the original standing position by placing the right foot of to next to the left foot on the initial position.\nRepeat with the right leg for the recommended amount of repetitions and then perform with the left leg.', 'De pie con la espalda recta, sostén una mancuerna con cada mano a los lados del cuerpo. Da un paso hacia delante subiendo en el step, banco o plataforma completamente, estirando bien la pierna de apoyo y vuelve a bajar en el orden de subida.', 'quadriceps', 'Pierna', 'Glúteo', '[\"Pierna\",\"Full Body\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Dumbbell_Step_Ups/images/0.jpg', '/uploads/exercises/exercise_273.gif', NULL, '2026-07-13 22:23:41'),
(279, 'Elbow to Knee', 'Crunch Superior Cruzado', 'Lie on the floor, crossing your right leg across your bent left knee. Clasp your hands behind your head, beginning with your shoulder blades on the ground. This will be your starting position.\nPerform the motion by flexing the spine and rotating your torso to bring the left elbow to the right knee.\nReturn to the starting position and repeat the movement for the desired number of repetitions before switching sides.', 'Acuéstate boca arriba con las rodillas dobladas y los pies apoyados en el suelo. Coloca las manos delante del pecho sin apoyar, con los dedos entrelazados. Levanta los hombros del suelo mientras contraes los abdominales. A medida que subes, gira el torso y lleva el codo derecho hacia la rodilla izquierda. Regresa a la posición []', 'abdominals', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Elbow_to_Knee/images/0.jpg', '/uploads/exercises/exercise_279.gif', NULL, '2026-07-13 22:23:41'),
(294, 'Finger Curls', 'Curl Concentrado de Dedos con Barra', 'Hold a barbell with both hands and your palms facing up; hands spaced about shoulder width.\nPlace your feet flat on the floor, at a distance that is slightly wider than shoulder width apart. This will be your starting position.\nLower the bar as far as possible by extending the fingers. Allowing the bar to roll down the hands, catch the bar with the final joint in the fingers.\nNow curl bar up as high as possible by closing your hands while exhaling. Hold the contraction at the top.', 'Sentado, con los antebrazos apoyados sobre las rodillas o el banco y las palmas de las manos mirando hacia arriba, sujetar la barra con las manos a la anchura de los hombros y descenderla suavemente sobre las manos estirando los dedos, sin despegar los antebrazos del apoyo. Estirar lo máximo posible y realizar la contracción []', 'forearms', 'Antebrazo', 'Antebrazo', '[]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Finger_Curls/images/0.jpg', '/uploads/exercises/exercise_294.gif', NULL, '2026-07-13 22:23:41'),
(296, 'Flat Bench Leg Pull-In', 'Elevación de Cadera con flexión de rodillas v1', 'Lie on an exercise mat or a flat bench with your legs off the end.\nPlace your hands either under your glutes with your palms down or by the sides holding on to the bench (or with palms down by the side on an exercise mat). Also extend your legs straight out. This will be your starting position.\nBend your knees and pull your upper thighs into your midsection as you breathe out. Continue this movement until your knees are near your chest. Hold the contracted position for a second.\nAs you breathe in, slowly return to the starting position.\nRepeat for the recommended amount of repetitions.', 'Acuéstate boca arriba con las piernas rectas y los pies apoyados en el suelo, manteniendo las manos a los lados del cuerpo con las palmas hacia abajo. Levanta lentamente las caderas del suelo, flexionando ligeramente las rodillas y llevando los muslos contra el abdomen. Alcanza la posición más alta posible y luego baja las caderas []', 'abdominals', 'Abdomen', 'Core/Abdomen', '[]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Flat_Bench_Leg_Pull-In/images/0.jpg', '/uploads/exercises/exercise_296.gif', NULL, '2026-07-13 22:23:41'),
(297, 'Flat Bench Lying Leg Raise', 'Elevación de Cadera con piernas estiradas', 'Lie with your back flat on a bench and your legs extended in front of you off the end.\nPlace your hands either under your glutes with your palms down or by the sides holding on to the bench. This will be your starting position.\nAs you keep your legs extended, straight as possible with your knees slightly bent but locked raise your legs until they make a 90-degree angle with the floor. Exhale as you perform this portion of the movement and hold the contraction at the top for a second.\nNow, as you inhale, slowly lower your legs back down to the starting position.', 'Acuéstate boca arriba con las piernas rectas y los pies apoyados en el suelo, manteniendo las manos a los lados del cuerpo con las palmas hacia abajo. Levanta lentamente las caderas del suelo, manteniendo las rodillas estiradas. Alcanza la posición más alta posible y luego baja las caderas de manera controlada hasta que vuelvan a []', 'abdominals', 'Abdomen', 'Core/Abdomen', '[\"Cuádriceps\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Flat_Bench_Lying_Leg_Raise/images/0.jpg', '/uploads/exercises/exercise_297.gif', NULL, '2026-07-13 22:23:41'),
(312, 'Front Cable Raise', 'Elevación Frontal en Polea', 'Select the weight on a low pulley machine and grasp the single hand cable attachment that is attached to the low pulley with your left hand.\nFace away from the pulley and put your arm straight down with the hand cable attachment in front of your thighs at arms\' length with the palms of the hand facing your thighs. This will be your starting position.\nWhile maintaining the torso stationary (no swinging), lift the left arm to the front with a slight bend on the elbow and the palms of the hand always faces down. Continue to go up until you arm is slightly above parallel to the floor. Exhale as you execute this portion of the movement and pause for a second at the top.\nNow as you inhale lower the arm back down slowly to the starting position.\nOnce all of the recommended amount of repetitions have been performed for this arm, switch arms and perform the exercise with the right one.', 'De pie de espaldas a la polea, con la espalda recta y las piernas ligeramente separadas, coge la barra con las manos en pronación (palmas hacia abajo) a la anchura de los hombros. Con los brazos rectos, eleva la barra hasta subir las manos un poco por encima de la altura de los hombros y []', 'shoulders', 'Hombro', 'Hombros', '[]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Front_Cable_Raise/images/0.jpg', '/uploads/exercises/exercise_312.gif', NULL, '2026-07-13 22:23:41'),
(314, 'Front Dumbbell Raise', 'Elevación Frontal con Mancuerna', 'Pick a couple of dumbbells and stand with a straight torso and the dumbbells on front of your thighs at arms length with the palms of the hand facing your thighs. This will be your starting position.\nWhile maintaining the torso stationary (no swinging), lift the left dumbbell to the front with a slight bend on the elbow and the palms of the hands always facing down. Continue to go up until you arm is slightly above parallel to the floor. Exhale as you execute this portion of the movement and pause for a second at the top. Inhale after the second pause.\nNow lower the dumbbell back down slowly to the starting position as you simultaneously lift the right dumbbell.\nContinue alternating in this fashion until all of the recommended amount of repetitions have been performed for each arm.', 'De pie con la espalda recta y las piernas ligeramente separadas, coge la mancuerna por delante del cuerpo con las dos manos y los dedos entrelazados. Con los brazos rectos, eleva las mancuernas frontalmente hasta ponerlas a la altura de la cabeza y desciende de nuevo de forma controlada.', 'shoulders', 'Hombro', 'Hombros', '[]', 1, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Front_Dumbbell_Raise/images/0.jpg', '/uploads/exercises/exercise_314.gif', NULL, '2026-07-13 22:23:41');
INSERT INTO `exercises` (`id`, `name`, `name_es`, `description`, `description_es`, `target_muscle`, `target_muscle_es`, `primary_muscle`, `secondary_muscles`, `is_warmup`, `media_type`, `media_url`, `local_media_path`, `created_by_trainer_id`, `created_at`) VALUES
(315, 'Front Incline Dumbbell Raise', 'Elevaciones Frontales en Pronación con Mancuernas', 'Sit down on an incline bench with the incline set anywhere between 30 to 60 degrees while holding a dumbbell on each hand. Tip: You can change the angle to hit the muscle a little differently each time.\nExtend your arms straight in front of you and have your palms facing down with the dumbbells raised about 1 inch above your thighs. This will be your starting position.\nSlowly raise the dumbbells straight up until they are slightly above your shoulders, while keeping your elbows locked. Squeeze at the top for a second and make sure you breathe out during this portion of the movement. Tip: Keep your head resting down against the bench and your legs on the floor at all times.\nLower the arms back to the starting position as you inhale.\nRepeat for the recommended amount of repetitions.', 'De pie con la espalda recta y las piernas ligeramente separadas, coge las mancuernas con las manos en pronación (palmas hacia atrás) y ponlas delante del cuerpo. Con los brazos rectos, eleva las mancuernas frontalmente hasta ponerlas a la altura de la cabeza y desciende de nuevo de forma controlada.', 'shoulders', 'Hombro', 'Hombros', '[\"Pecho\"]', 1, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Front_Incline_Dumbbell_Raise/images/0.jpg', '/uploads/exercises/exercise_315.gif', NULL, '2026-07-13 22:23:41'),
(322, 'Full Range-Of-Motion Lat Pulldown', 'Extensiones Cruzadas en Polea Alta', 'Either standing or seated on a high bench, grasp two stirrup cables that are attached to the high pulleys. Grab with the opposing hand so your arms are crisscrossed about you and your palms are facing forward.\nKeeping your chest up and maintaining a slight arch in your lower back, pull the handles down as if you were doing a regular pulldown. The range of motion will be more of an arc. During the movement, rotate your hands so that in the bottom position your palms face each other rather than forward. Return slowly to the starting position and repeat.', 'De pie entre dos poleas altas, con la espalda recta y las piernas ligeramente separadas, coge el agarre del lado opuesto con cada mano, con las palmas hacia delante, estirando los brazos hacia arriba de forma que queden cruzadas delante de la cabeza. Tira de ambas manos hacia abajo en diagonal, abriendo los brazos a []', 'lats', 'Espalda', 'Hombros', '[\"Dorsal\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Full_Range-Of-Motion_Lat_Pulldown/images/0.jpg', '/uploads/exercises/exercise_322.gif', NULL, '2026-07-13 22:23:41'),
(337, 'Handstand Push-Ups', 'Press Militar Libre', 'With your back to the wall bend at the waist and place both hands on the floor at shoulder width.\nKick yourself up against the wall with your arms straight. Your body should be upside down with the arms and legs fully extended. Keep your whole body as straight as possible. Tip: If doing this for the first time, have a spotter help you. Also, make sure that you keep facing the wall with your head, rather than looking down.\nSlowly lower yourself to the ground as you inhale until your head almost touches the floor. Tip: It is of utmost importance that you come down slow in order to avoid head injury.\nPush yourself back up slowly as you exhale until your elbows are nearly locked.\nRepeat for the recommended amount of repetitions.', 'Apoya las manos en el suelo cerca de la pared a la anchura de los hombros, y como si fuese a hacer el pino, de un impulso ponte totalmente cabeza abajo, con los pies apoyados arriba de la pared. Flexiona los brazos y estira de nuevo totalmente levantando tu peso corporal.', 'shoulders', 'Hombro', 'Tríceps', '[\"Dorsal\",\"Full Body\",\"Cardio\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Handstand_Push-Ups/images/0.jpg', '/uploads/exercises/exercise_337.gif', NULL, '2026-07-13 22:23:41'),
(339, 'Hanging Leg Raise', 'Elevación de piernas flexionadas Colgado', 'Hang from a chin-up bar with both arms extended at arms length in top of you using either a wide grip or a medium grip. The legs should be straight down with the pelvis rolled slightly backwards. This will be your starting position.\nRaise your legs until the torso makes a 90-degree angle with the legs. Exhale as you perform this movement and hold the contraction for a second or so.\nGo back slowly to the starting position as you breathe in.\nRepeat for the recommended amount of repetitions.', 'Cuélgate de una barra de dominadas con las manos hacia delante a una anchura algo superior a la de los hombros. Eleva las piernas con ellas flexionadas mediante la contracción del abdomen hasta tener las rodillas delante del pecho. Desciende de forma controlada y vuelve a subir evitando balanceos.', 'abdominals', 'Abdomen', 'Core/Abdomen', '[]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Hanging_Leg_Raise/images/0.jpg', '/uploads/exercises/exercise_339.gif', NULL, '2026-07-13 22:23:41'),
(340, 'Hanging Pike', 'Elevación Total Colgado', 'Hang from a chin-up bar with your legs and feet together using an overhand grip (palms facing away from you) that is slightly wider than shoulder width. Tip: You may use wrist wraps in order to facilitate holding on to the bar.\nNow bend your knees at a 90 degree angle and bring the upper legs forward so that the calves are perpendicular to the floor while the thighs remain parallel to it. This will be your starting position.\nPull your legs up as you exhale until you almost touch your shins with the bar above you. Tip: Try to straighten your legs as much as possible while at the top.\nLower your legs as slowly as possible until you reach the starting position. Tip: Avoid swinging and using momentum at all times.\nRepeat for the recommended amount of repetitions.', 'Cuélgate de una barra de dominadas con las manos hacia delante a una anchura algo superior a la de los hombros. Flexiona las piernas hacia delante, con los muslos a 90° del torso y también de los gemelos. Manteniendo esa posición de las piernas, eleva todo el cuerpo mediante la contracción del abdomen hasta tener []', 'abdominals', 'Abdomen', 'Core/Abdomen', '[]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Hanging_Pike/images/0.jpg', '/uploads/exercises/exercise_340.gif', NULL, '2026-07-13 22:23:41'),
(350, 'Hip Flexion with Band', 'Extensión Frontal Aislada con Banda', 'Secure one end of the band to the lower portion of a post and attach the other to one ankle.\nFace away from the attachment point of the band.\nKeeping your head and your chest up, raise your knee up to 90 degrees and pause.\nReturn the leg to the starting position.', 'De pie con las piernas juntas, pon la banda en algún lugar bajo y enrollada a tu tobillo. Levanta la pierna hacia delante flexionando la rodilla a 90°.', 'quadriceps', 'Pierna', 'Core/Abdomen', '[\"Cardio\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Hip_Flexion_with_Band/images/0.jpg', '/uploads/exercises/exercise_350.gif', NULL, '2026-07-13 22:23:41'),
(351, 'Hip Lift with Band', 'Hip Thrust con Banda', 'After choosing a suitable band, lay down in the middle of the rack, after securing the band on either side of you. If your rack doesn\'t have pegs, the band can be secured using heavy dumbbells or similar objects, just ensure they won\'t move.\nAdjust your position so that the band is directly over your hips. Bend your knees and place your feet flat on the floor. Your hands can be on the floor or holding the band in position.\nKeeping your shoulders on the ground, drive through your heels to raise your hips, pushing into the band as high as you can.\nPause at the top of the motion, and return to the starting position.', 'Tumbado hacia arriba en el suelo con las piernas flexionadas, abre los brazos hacia los lados formando un ángulo de 45° con el cuerpo. Con las manos hacia abajo, ponlas sobre una banda que pase por tu cadera tensando lo que consideres oportuno. Eleva la pelvis tensando bien los glúteos arriba. Puedes poner las manos []', 'glutes', 'Pierna', 'Glúteo', '[\"Femoral\"]', 1, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Hip_Lift_with_Band/images/0.jpg', '/uploads/exercises/exercise_351.gif', NULL, '2026-07-13 22:23:41'),
(359, 'Incline Barbell Triceps Extension', 'Extensión Inclinada con Barra Z', 'Hold a barbell with an overhand grip (palms down) that is a little closer together than shoulder width.\nLie back on an incline bench set at any angle between 45-75-degrees.\nBring the bar overhead with your arms extended and elbows in. The arms should be in line with the torso above the head. This will be your starting position.\nNow lower the bar in a semicircular motion behind your head until your forearms touch your biceps. Inhale as you perform this movement. Tip: Keep your upper arms stationary and close to your head at all times. Only the forearms should move.\nReturn to the starting position as you breathe out and you contract the triceps. Hold the contraction for a second.\nRepeat for the recommended amount of repetitions.', 'Tumbado hacia arriba en un banco inclinado, coge la barra z por el interior con las palmas hacia arriba, frente al pecho y estira los brazos. Flexiona los codos y desciende la barra hasta llegar con ella sobre la cabeza, sin mover los brazos. Vuelve a subir la barra estirando bien los codos.', 'triceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Incline_Barbell_Triceps_Extension/images/0.jpg', '/uploads/exercises/exercise_359.gif', NULL, '2026-07-13 22:23:41'),
(364, 'Incline Dumbbell Curl', 'Curl Inclinado con giro Alterno con Mancuernas', 'Sit back on an incline bench with a dumbbell in each hand held at arms length. Keep your elbows close to your torso and rotate the palms of your hands until they are facing forward. This will be your starting position.\nWhile holding the upper arm stationary, curl the weights forward while contracting the biceps as you breathe out. Only the forearms should move. Continue the movement until your biceps are fully contracted and the dumbbells are at shoulder level. Hold the contracted position for a second.\nSlowly begin to bring the dumbbells back to starting position as your breathe in.\nRepeat for the recommended amount of repetitions.', 'Sentado en un banco inclinado, coge una mancuerna con cada mano con las palmas hacia el interior (agarre neutro o martillo) y deja caer los brazos a ambos lados del cuerpo. Flexiona un codo subiendo la mancuerna a la altura del pecho mientras giras la muñeca con la palma hacia arriba. Mientras desciendes, sube el []', 'biceps', 'Bíceps', 'Bíceps', '[\"Antebrazo\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Incline_Dumbbell_Curl/images/0.jpg', '/uploads/exercises/exercise_364.gif', NULL, '2026-07-13 22:23:41'),
(369, 'Incline Inner Biceps Curl', 'Curl Inclinado Lateral con Mancuernas', 'Hold a dumbbell in each hand and lie back on an incline bench.\nThe dumbbells should be at arm\'s length hanging at your sides and your palms should be facing out. This will be your starting position.\nNow as you exhale curl the weight outward and up while keeping your forearms in line with your side deltoids. Continue the curl until the dumbbells are at shoulder height and to the sides of your deltoids. Tip: The end of the movement should look similar to a double biceps pose.\nAfter a second contraction at the top of the movement, start to inhale and slowly lower the weights back to the starting position using the same path used to bring them up.\nRepeat for the recommended amount of repetitions.', 'Sentado en un banco inclinado, coge una mancuerna con cada mano con las palmas hacia arriba (supinación) y deja caer los brazos a ambos lados del cuerpo, separándolos formando un ángulo de 45º con el mismo. Flexiona los codos subiendo las mancuernas a la altura de los hombros. Desciende de forma controlada.', 'biceps', 'Bíceps', 'Bíceps', '[\"Antebrazo\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Incline_Inner_Biceps_Curl/images/0.jpg', '/uploads/exercises/exercise_369.gif', NULL, '2026-07-13 22:23:41'),
(371, 'Incline Push-Up Close-Grip', 'Flexiones Cerradas', 'Stand facing a Smith machine bar or sturdy elevated platform at an appropriate height.\nPlace your hands next to one another on the bar.\nPosition your feet back from the bar with arms and body straight. This will be your starting position.\nKeeping your body straight, lower your chest to the bar by bending the arms.\nReturn to the starting position by extending the elbows, pressing yourself back up.', NULL, 'triceps', 'Pecho', 'Tríceps', '[\"Pecho\"]', 1, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Incline_Push-Up_Close-Grip/images/0.jpg', '/uploads/exercises/exercise_371.gif', NULL, '2026-07-13 22:23:41'),
(379, 'Inverted Row', 'Remo Colgado en Pronación', 'Position a bar in a rack to about waist height. You can also use a smith machine.\nTake a wider than shoulder width grip on the bar and position yourself hanging underneath the bar. Your body should be straight with your heels on the ground with your arms fully extended. This will be your starting position.\nBegin by flexing the elbow, pulling your chest towards the bar. Retract your shoulder blades as you perform the movement.\nPause at the top of the motion, and return yourself to the start position.\nRepeat for the desired number of repetitions.', 'Coloca una barra entre dos soportes a la altura aproximada de la cadera. Túmbate en el suelo y cuélgate de la barra estirando los brazos hasta que estén completamente rectos y con las manos en pronación (palmas hacia los pies) a la anchura de los hombros. Sube el cuerpo flexionando los codos y retrae las []', 'middle back', 'Espalda', 'Pecho', '[\"Tríceps\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Inverted_Row/images/0.jpg', '/uploads/exercises/exercise_379.gif', NULL, '2026-07-13 22:23:41'),
(380, 'Inverted Row with Straps', 'Remo Libre Horizontal Abierto con Cuerdas', 'Hang a rope or suspension straps from a rack or other stable object. Grasp the ends and position yourself in a supine position hanging from the ropes. Your body should be straight with your heels on the ground with your arms fully extended. This will be your starting position.\nBegin by flexing the elbow, pulling your chest to your hands. Retract your shoulder blades as you perform the movement.\nPause at the top of the motion, and return yourself to the start position.\nRepeat for the desired number of repetitions.', 'Pon la cuerda en un lugar alto. Agarra un extremo con cada mano y déjate caer hacia atrás hasta casi tocar el suelo con la espalda. Con los brazos estirados, realiza la flexión de los codos abriéndolos a los lados y elevando el cuerpo hacia las bandas.', 'middle back', 'Espalda', 'Espalda', '[\"Antebrazo\",\"Bíceps\",\"Hombros\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Inverted_Row_with_Straps/images/0.jpg', '/uploads/exercises/exercise_380.gif', NULL, '2026-07-13 22:23:41'),
(388, 'Jackknife Sit-Up', 'Jackknife Sit-Up', 'Lie flat on the floor (or exercise mat) on your back with your arms extended straight back behind your head and your legs extended also. This will be your starting position.\nAs you exhale, bend at the waist while simultaneously raising your legs and arms to meet in a jackknife position. Tip: The legs should be extended and lifted at approximately a 35-45 degree angle from the floor and the arms should be extended and parallel to your legs. The upper torso should be off the floor.\nWhile inhaling, lower your arms and legs back to the starting position.\nRepeat for the recommended amount of repetitions.', 'Acuéstate boca arriba sobre una estera con los brazos extendidos por encima de la cabeza y las piernas rectas. A medida que inhalas, contrae los abdominales y levanta simultáneamente los brazos y las piernas del suelo, manteniéndolos rectos. Dirige tus manos hacia tus pies, intentando tocarlos mientras elevas el torso y las piernas. Mantén la []', 'abdominals', 'Abdomen', 'Core/Abdomen', '[]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Jackknife_Sit-Up/images/0.jpg', '/uploads/exercises/exercise_388.gif', NULL, '2026-07-13 22:23:41'),
(389, 'Janda Sit-Up', 'Janda Sit-up', 'Position your body on the floor in the basic sit-up position; knees to a ninety degree angle with feet flat on the floor and arms either crossed over your chest or to the sides. This will be your starting position.\nAs you strongly tighten your glutes and hamstrings, fill your lungs with air and in a slow (three to six second count) ascent, slowly exhale. Tip: It is important to tighten the glutes and hamstrings as this will cause the hip flexors to be inactivated in a process called reciprocal inhibition, which basically means that opposite muscles to the contracted ones will relax.\nAs you inhale, slowly go back in a controlled manner to the starting position.\nRepeat for the recommended amount of repetitions.', 'Siéntate en el suelo con las piernas ligeramente flexionadas, los brazos entrelazados en el pecho pero con los codos perpendiculares, sin apoyar. Deslízate hacia atrás manteniendo el control, luego utiliza los músculos abdominales para levantar el torso de nuevo. Concéntrate en activar los abdominales, evita el impulso y repite el movimiento. Este ejercicio fortalece el []', 'abdominals', 'Abdomen', 'Core/Abdomen', '[]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Janda_Sit-Up/images/0.jpg', '/uploads/exercises/exercise_389.gif', NULL, '2026-07-13 22:23:41'),
(414, 'Kneeling Cable Triceps Extension', 'Extensiones Concentradas en Polea Alta', 'Place a bench sideways in front of a high pulley machine.\nHold a straight bar attachment above your head with your hands about 6 inches apart with your palms facing down.\nFace away from the machine and kneel.\nPlace your head and the back of your upper arms on the bench. Your elbows should be bent with the forearms pointing towards the high pulley. This will be your starting position.\nWhile keeping your upper arms close to your head at all times with the elbows in, press the bar out in a semicircular motion until the elbows are locked and your arms are parallel to the floor. Contract the triceps hard and keep this position for a second. Exhale as you perform this movement.\nSlowly return to the starting position as you breathe in.\nRepeat for the recommended amount of repetitions.', 'De rodillas y de espaldas a la polea alta, coge la barra con ambas manos hacia delante (pronación) a la anchura de los hombros. Inclina el cuerpo hacia delante y apoya la parte trasera de los codos en un banco, con ellos flexionados 90º. Estira hacia delante y retrocede de forma controlada.', 'triceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Kneeling_Cable_Triceps_Extension/images/0.jpg', '/uploads/exercises/exercise_414.gif', NULL, '2026-07-13 22:23:41'),
(418, 'Kneeling Jump Squat', 'Saltos rodillas en cuclillas con Barra', 'Begin kneeling on the floor with a barbell racked across the back of your shoulders, or you can use your body weight for this exercise. This can be done inside of a power rack to make unracking easier.\nSit back with your hips until your glutes touch your feet, keeping your head and chest up.\nExplode up with your hips, generating enough power to land with your feet flat on the floor.\nContinue with the squat by driving through your heels and extending the knees to come to a standing position.', 'De rodillas en el suelo, coge una barra sobre el trapecio, ayudando a mantenerla con las manos a los lados de los hombros. Con la punta de los pies apoyada en el suelo (dedos flexionados), de un impulso salta hasta ponerte en cuclillas. Déjate caer suavemente hacia delante y vuelve a repetir.', 'glutes', 'Pierna', 'Cuádriceps', '[\"Cardio\",\"Full Body\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Kneeling_Jump_Squat/images/0.jpg', '/uploads/exercises/exercise_418.gif', NULL, '2026-07-13 22:23:41'),
(442, 'Leverage Incline Chest Press', 'Press Frontal Superior en Máquina', 'Load an appropriate weight onto the pins and adjust the seat for your height. The handles should be near the top of the pectorals at the beginning of the motion. Your chest and head should be up and your shoulder blades retracted. This will be your starting position.\nPress the handles forward by extending through the elbow.\nAfter a brief pause at the top, return the weight just above the start position, keeping tension on the muscles by not returning the weight to the stops until the set is complete.', 'Sentado en la máquina con el respaldo vertical, ponemos las manos en pronación (palmas hacia el suelo) a una anchura un poco superior a la de los hombros. Estiramos los brazos y volvemos a la posición inicial con un movimiento controlado.', 'chest', 'Pecho', 'Pecho', '[\"Tríceps\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Leverage_Incline_Chest_Press/images/0.jpg', '/uploads/exercises/exercise_442.gif', NULL, '2026-07-13 22:23:41'),
(460, 'Lying Cable Curl', 'Curl Horizontal Cerrado en Supinación con Polea', 'Grab a straight bar or E-Z bar attachment that is attached to the low pulley with both hands, using an underhand (palms facing up) shoulder-width grip.\nLie flat on your back on top of an exercise mat in front of the weight stack with your feet flat against the frame of the pulley machine and your legs straight.\nWith your arms extended and your elbows close to your body slightly bend your arms. This will be your starting position.\nWhile keeping your upper arms stationary and the elbows close to your body, curl the bar up slowly toward your chest as you breathe out and you squeeze the biceps.\nAfter a second squeeze at the top of the movement, slowly return to the starting position.\nRepeat for the recommended amount of repetitions.', 'Tumbado hacia arriba en un banco plano, coge la barra de la polea con las manos a una anchura inferior a la de los hombros y las palmas hacia arriba (supinación). Flexiona los codos y elévalos, de forma que llegues con la barra hasta la cara. Luego desciende de nuevo lentamente.', 'biceps', 'Bíceps', 'Bíceps', '[]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Lying_Cable_Curl/images/0.jpg', '/uploads/exercises/exercise_460.gif', NULL, '2026-07-13 22:23:41'),
(462, 'Lying Close-Grip Barbell Triceps Extension Behind The Head', 'Press Francés tras nuca con Barra', 'While holding a barbell or EZ Curl bar with a pronated grip (palms facing forward), lie on your back on a flat bench with your head close to the end of the bench. Tip: If you are holding a barbell grab it using a shoulder-width grip and if you are using an E-Z Bar grab it on the inner handles.\nExtend your arms in front of you and slowly bring the bar back in a semi circular motion (while keeping the arms extended) to a position over your head. At the end of this step your arms should be overhead and parallel to the floor. This will be your starting position. Tip: Keep your elbows in at all times.\nAs you inhale, lower the bar by bending at the elbows and while keeping the upper arm stationary. Keep lowering the bar until your forearms are perpendicular to the floor.\nAs you exhale bring the bar back up to the starting position by pushing the bar up in a semi-circular motion until the lower arms are also parallel to the floor. Contract the triceps hard at the top of the movement for a second. Tip: Again, only the forearms should move. The upper arms should remain stationary at all times.\nRepeat for the recommended amount of repetitions.', 'Tumbado hacia arriba en un banco, coge la barra a la anchura de los hombros con las palmas hacia arriba, frente al pecho y estira los brazos. Deja caer los brazos extendidos hacia atrás, formando una línea recta con el cuerpo. A continuación comienza el ejercicio, flexiona los codos 90 grados y desciende la barra []', 'triceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Lying_Close-Grip_Barbell_Triceps_Extension_Behind_The_Head/images/0.jpg', '/uploads/exercises/exercise_462.gif', NULL, '2026-07-13 22:23:41'),
(476, 'Lying Rear Delt Raise', 'Elevación Frontal Declinada en Pronación con Barra', 'While holding a dumbbell in each hand, lay with your chest down on a flat bench.\nPosition the palms of the hands in a neutral manner (palms facing your torso) as you keep the arms extended with the elbows slightly bent. This will be your starting position.\nNow raise the arms to the side until your elbows are at shoulder height and your arms are roughly parallel to the floor as you exhale. Tip: Maintain your arms perpendicular to the torso while keeping them extended throughout the movement. Also, keep the contraction at the top for a second.\nSlowly lower the dumbbells to the starting position as you inhale.\nRepeat for the recommended amount of repetitions and then switch to the other arm.', 'Túmbate hacia abajo en un banco declinado, apoyando el pecho en el respaldo y con los pies en el suelo. Coge la barra con las manos en pronación (palmas hacia abajo) a la anchura de los hombros. Con los codos ligeramente flexionados, eleva la barra hasta poner la barra a la altura de la cabeza []', 'shoulders', 'Hombro', 'Hombros', '[\"Antebrazo\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Lying_Rear_Delt_Raise/images/0.jpg', '/uploads/exercises/exercise_476.gif', NULL, '2026-07-13 22:23:41'),
(477, 'Lying Supine Dumbbell Curl', 'Curl Horizontal con giro con Mancuernas', 'Lie down on a flat bench face up while holding a dumbbell in each arm on top of your thighs.\nBring the dumbbells to the sides with the arms extended and the palms of the hands facing your thighs (neutral grip).\nWhile keeping the arms close to your torso and elbows in, slowly lower your arms (as you keep them extended with a slight bend at the elbows) as far down towards the floor as you can go. Once you cannot go down any further, lock your upper arms in that position and that will be your starting position.\nAs you breathe out, slowly begin to curl the weights up as you simultaneously rotate your wrists so that the palms of the hands face up. Continue curling the weight until your biceps are fully contracted and squeeze hard at the top position for a second. Tip: Only the forearms should move. Upper arms should remain stationary and elbows should stay in throughout the movement.\nReturn back to the starting position very slowly.', 'Tumbado hacia arriba en un banco plano, coge una mancuerna con cada mano con las palmas hacia el cuerpo (agarre neutro) y extiende los brazos a los lados, a 45º del cuerpo. Flexiona los codos manteniendo los brazos inmovilizados, hasta llegar con las mancuernas frente al pecho, mientras giras las muñecas hacia adentro (palmas hacia []', 'biceps', 'Bíceps', 'Bíceps', '[\"Hombros\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Lying_Supine_Dumbbell_Curl/images/0.jpg', '/uploads/exercises/exercise_477.gif', NULL, '2026-07-13 22:23:41'),
(478, 'Lying T-Bar Row', 'Remo en Barra T en Pronación', 'Load up the T-bar Row Machine with the desired weight and adjust the leg height so that your upper chest is at the top of the pad. Tip: In some machines all you can do is stand on the appropriate step that allows you to be at a height that has the upper chest at the top of the pad.\nLay face down on the pad and grab the handles. You can either use a palms down, palms up, or palms in position depending on what part of your back you want to emphasize.\nLift the bar off the rack and extend your arms in front of you. This will be your starting position.\nAs you exhale slowly pull the weight up and squeeze your back at the top of the movement. Tip: Keep the upper arms as close to the torso as possible throughout the movement in order to better engage the back muscles. Also, do not lift your body off of the pad at any time and refrain from using the biceps to lift the weight.\nAfter a second contraction at the top of the movement, as you inhale, slowly go back down to the starting position.\nRepeat for the recommended amount of repetitions.', 'Apoyando en pecho en el banco y las piernas ligeramente flexionadas, agarraremos con las manos en pronación (palmas hacia atrás). Desde esta posición estiraremos el dorsal y separaremos las escápulas para comenzar la repetición. Primero retraeremos las escápulas y acercaremos el peso lo máximo posible a nuestro pecho, intentando mover los codos hacia el cuerpo []', 'middle back', 'Espalda', 'Espalda', '[\"Dorsal\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Lying_T-Bar_Row/images/0.jpg', '/uploads/exercises/exercise_478.gif', NULL, '2026-07-13 22:23:41'),
(490, 'Mixed Grip Chin', 'Dominada Mixta', 'Using a spacing that is just about 1 inch wider than shoulder width, grab a pull-up bar with the palms of one hand facing forward and the palms of the other hand facing towards you. This will be your starting position.\nNow start to pull yourself up as you exhale. Tip: With the arm that has the palms facing up concentrate on using the back muscles in order to perform the movement. The elbow of that arm should remain close to the torso. With the other arm that has the palms facing forward, the elbows will be away but in line with the torso. You will concentrate on using the lats to pull your body up.\nAfter a second contraction at the top, start to slowly come down as you inhale.\nRepeat for the recommended amount of repetitions.\nOn the following set, switch grips; so if you had the right hand with the palms facing you and the left one with the palms facing forward, on the next set you will have the palms facing forward for the right hand and facing you for the left.', 'Colgado en una barra de dominadas con las manos a una anchura algo mayor que la de los hombros y una palma hacia cada lado, sube el cuerpo mediante la flexión de los brazos hasta pasar la cabeza sobre la barra. Desciende lentamente.', 'middle back', 'Espalda', 'Espalda', '[\"Dorsal\"]', 1, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Mixed_Grip_Chin/images/0.jpg', '/uploads/exercises/exercise_490.gif', NULL, '2026-07-13 22:23:41'),
(497, 'Narrow Stance Leg Press', 'Prensa Inclinada Cerrada', 'Using a leg press machine, sit down on the machine and place your legs on the platform directly in front of you at a less-than-shoulder-width narrow stance with the toes slightly pointed out. Your feet should be around 3 inches or less apart. Tip: Keep your head up at all times and also maintain the back on the pad at all times.\nLower the safety bars holding the weighted platform in place and press the platform all the way up until your legs are fully extended in front of you. Tip: Make sure that you do not lock your knees. Your torso and the legs should make a perfect 90-degree angle. This will be your starting position.\nAs you inhale, slowly lower the platform until your upper and lower legs make a 90-degree angle.\nPushing mainly with the heels of your feet and using the quadriceps go back to the starting position as you exhale.\nRepeat for the recommended amount of repetitions and ensure to lock the safety pins properly once you are done. You do not want that platform falling on you fully loaded.', 'Colócate con la espalda bien apoyada en el respaldo de la máquina inclinada a 45 grados y los pies sobre la plataforma, a una anchura inferior a la de los hombros. Quita los soportes laterales del peso y empuja la plataforma con las piernas para dejar casi extendidas las mismas. Desde allí, inspira y con []', 'quadriceps', 'Pierna', 'Pierna', '[\"Femoral\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Narrow_Stance_Leg_Press/images/0.jpg', '/uploads/exercises/exercise_497.gif', NULL, '2026-07-13 22:23:41'),
(503, 'Oblique Crunches - On The Floor', 'Crunch Lateral Horizontal Concentrado', 'Start out by lying on your right side with your legs lying on top of each other. Make sure your knees are bent a little bit.\nPlace your left hand behind your head.\nOnce you are in this set position, begin by moving your left elbow up as you would perform a normal crunch except this time the main emphasis is on your obliques.\nCrunch as high as you can, hold the contraction for a second and then slowly drop back down into the starting position.\nRemember to breathe in during the eccentric (lowering) part of the exercise and to breathe out during the concentric (elevation) part of the exercise.', 'Acuéstate de lado en el suelo con las piernas juntas y ligeramente flexionadas. Coloca la mano del brazo superior detrás de la cabeza o en el suelo frente a ti. Contrae los abdominales y levanta el torso hacia el lado, llevando el codo hacia la cadera en un movimiento de crunch lateral. Baja el torso []', 'abdominals', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Oblique_Crunches_-_On_The_Floor/images/0.jpg', '/uploads/exercises/exercise_503.gif', NULL, '2026-07-13 22:23:41'),
(508, 'One-Arm High-Pulley Cable Side Bends', 'Crunch Lateral de pie en Polea Baja', 'Connect a standard handle to a tower. Move cable to highest pulley position.\nStand with side to cable. With one hand, reach up and grab handle with underhand grip.\nPull down cable until elbow touches your side and the handle is by your shoulder.\nPosition feet hip-width apart. Place free hand on hip to help gauge pivot point.\nKeep arm in static position. Contract oblique to bring the weight down in a side crunch.\nOnce you reach maximum contraction, slowly release the weight to the starting position. The weight stack should never be unloaded in a resting position. The aim is constant tension during the set.\nRepeat to failure.\nThen, reposition and repeat the same series of movements on the opposite side.', 'De pie situado al lado de la polea baja, coge el agarre con una mano con el brazo extendido al lado del cuerpo. Encoge el torso lateralmente hacia el lado de la polea. A continuación inclínate hacia el lado opuesto mediante la contracción de los abdominales oblicuos, sin tirar del brazo. Al terminar la serie []', 'abdominals', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/One-Arm_High-Pulley_Cable_Side_Bends/images/0.jpg', '/uploads/exercises/exercise_508.gif', NULL, '2026-07-13 22:23:41'),
(509, 'One-Arm Incline Lateral Raise', 'Elevación Lateral Inclinada Aislada con Mancuerna', 'Lie down sideways on an incline bench press with a dumbbell in the hand. Make sure the shoulder is pressing against the incline bench and the arm is lying across your body with the palm around your navel.\nHold a dumbbell in your uppermost arm while keeping it extended in front of you parallel to the floor. This is your starting position.\nWhile keeping the dumbbell parallel to the floor at all times, perform a lateral raise. Your arm should travel straight up until it is pointing at the ceiling. Tip: Exhale as you perform this movement. Hold the dumbbell in the position and feel the contraction in the shoulders for a second.\nWhile inhaling lower the weight across your body back into the starting position.\nRepeat the movement for the prescribed amount of repetitions.\nSwitch arms and repeat the movement.', 'Tumbado de lado sobre un banco inclinado, coge una mancuerna con el brazo superior, con el brazo estirado y paralelo al cuerpo. Eleva el brazo hasta ponerlo en vertical y desciende de forma controlada. Con la otra mano puedes agarrar el banco.', 'shoulders', 'Hombro', 'Hombros', '[\"Trapecio\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/One-Arm_Incline_Lateral_Raise/images/0.jpg', '/uploads/exercises/exercise_509.gif', NULL, '2026-07-13 22:23:41'),
(530, 'One Arm Chin-Up', 'Dominada a una mano asistida', 'For this exercise, start out by placing a towel around a chin up bar.\nGrab the chin-up bar with your palm facing you. One hand will be grabbing the chin-up bar and the other will be grabbing the towel.\nBring your torso back around 30 degrees or so while creating a curvature on your lower back and sticking your chest out. This is your starting position.v\nPull your torso up until the bar touches your upper chest by drawing the shoulders and the upper arms down and back. Exhale as you perform this portion of the movement. Tip: Concentrate on squeezing the back muscles once you reach the full contracted position. The upper torso should remain stationary as it moves through space and only the arms should move. The forearms should do no other work other than hold the bar.\nAfter a second on the contracted position, start to inhale and slowly lower your torso back to the starting position when your arms are fully extended and the lats are fully stretched.\nRepeat this motion for the prescribed amount of repetitions.\nSwitch arms and repeat the movement.', 'Colgado en una barra de dominadas con una mano en agarre supino (palma hacia atrás) y otra mano en una cuerda o toalla más abajo y enganchada al otro lado de la barra, sube el cuerpo mediante la flexión del brazo hasta llegar con la cabeza a la barra. Desciende lentamente.', 'middle back', 'Espalda', 'Bíceps', '[\"Espalda\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/One_Arm_Chin-Up/images/0.jpg', '/uploads/exercises/exercise_530.gif', NULL, '2026-07-13 22:23:41'),
(531, 'One Arm Dumbbell Bench Press', 'Press Banca con Mancuernas', 'Lie down on a flat bench with a dumbbell in one hand on top of your thigh.\nBy using your thigh to help you get the dumbbell up, clean the dumbbell up so that you can hold it in front of you at shoulder width. Use the hand you are not lifting with to help position the dumbbell over you properly.\nOnce at shoulder width, rotate your wrist forward so that the palm of your hand is facing away from you. This will be your starting position.\nBring down the weights slowly to your side as you breathe in. Keep full control of the dumbbell at all times. Tip: Use the hand that you are not lifting with to help keep the dumbbell balance as you may struggle a bit at first. Only use your non-lifting hand if it is needed. Otherwise, keep it resting to the side.\nAs you breathe out, push the dumbbells up using your pectoral muscles. Lock your arms in the contracted position, squeeze your chest, hold for a second and then start coming down slowly. Tip: It should take at least twice as long to go down than to come up.\nRepeat the movement for the prescribed amount of repetitions of your training program.\nSwitch arms and repeat the movement.', 'Túmbate de espaldas en el banco plano y coge las mancuernas con agarre en pronación (palmas hacia los pies), directamente sobre los hombros con los brazos totalmente extendidos. Las mancuernas no deben estar en contacto, si no una sobre cada pectoral. Junta los omóplatos y saca pecho ligeramente. Baja las mancuernas a ambos lados del []', 'chest', 'Pecho', 'Pecho', '[\"Tríceps\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/One_Arm_Dumbbell_Bench_Press/images/0.jpg', '/uploads/exercises/exercise_531.gif', NULL, '2026-07-13 22:23:41'),
(532, 'One Arm Dumbbell Preacher Curl', 'Curl en Banco Scott en Supinación con Mancuerna', 'Grab a dumbbell with the right arm and place the upper arm on top of the preacher bench or the incline bench. The dumbbell should be held at shoulder length. This will be your starting position.\nAs you breathe in, slowly lower the dumbbell until your upper arm is extended and the biceps is fully stretched.\nAs you exhale, use the biceps to curl the weight up until your biceps is fully contracted and the dumbbell is at shoulder height. Again, remember that to ensure full contraction you need to bring that small finger higher than the thumb.\nSqueeze the biceps hard for a second at the contracted position and repeat for the recommended amount of repetitions.\nSwitch arms and repeat the movement.', 'Sentado en el banco con el pecho apoyado, coge una mancuerna con agarre en supinación (palma hacia arriba). Apoya bien la parte trasera superior del brazo en el banco scott y flexiona el codo subiendo la mancuerna. Desciende lentamente sin llegar a estirar del todo.', 'biceps', 'Bíceps', 'Bíceps', '[\"Antebrazo\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/One_Arm_Dumbbell_Preacher_Curl/images/0.jpg', '/uploads/exercises/exercise_532.gif', NULL, '2026-07-13 22:23:41'),
(533, 'One Arm Floor Press', 'Press a una mano con Barra', 'Lie down on a flat surface with your back pressing against the floor or an exercise mat. Make sure your knees are bent.\nHave a partner hand you the bar on one hand. When starting, your arm should be just about fully extended, similar to the starting position of a barbell bench press. However, this time your grip will be neutral (palms facing your torso).\nMake sure the hand you are not using to lift the weight is placed by your side.\nBegin the exercise by lowering the barbell until your elbow touches the ground. Make sure to breathe in as this is the eccentric (lowering part of the exercise).\nThen start lifting the barbell back up to the original starting position. Remember to breathe out during the concentric (lifting part of the exercise).\nRepeat until you have performed your recommended repetitions.\nSwitch arms and repeat the movement.', 'Tumbado sobre el suelo o en un banco, coge la barra por el centro con agarre neutro. Estira el brazo tensando bien arriba y desciende hasta tener el codo flexionado a 90 grados. Al terminar la serie cambiar de brazo.', 'triceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/One_Arm_Floor_Press/images/0.jpg', '/uploads/exercises/exercise_533.gif', NULL, '2026-07-13 22:23:41'),
(534, 'One Arm Lat Pulldown', 'Jalón Aislado Prono-Neutro en Polea Alta', 'Select an appropriate weight and adjust the knee pad to help keep you down. Grasp the handle with a pronated grip. This will be your starting position.\nPull the handle down, squeezing your elbow to your side as you flex the elbow.\nPause at the bottom of the motion, and then slowly return the handle to the starting position.\nFor multiple repetitions, avoid completely returning the weight to keep tension on the muscles being worked.', 'Sentado delante de la polea alta, estira un brazo hacia arriba y coge el agarre con la palma de la mano hacia delante. Baja el codo hacia el costado girando la mano hacia el interior y vuelve a subir de forma controlada sin llegar a descansar.', 'lats', 'Espalda', 'Dorsal', '[\"Espalda\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/One_Arm_Lat_Pulldown/images/0.jpg', '/uploads/exercises/exercise_534.gif', NULL, '2026-07-13 22:23:41'),
(535, 'One Arm Pronated Dumbbell Triceps Extension', 'Extensión Horizontal Concentrada Interna con Mancuerna', 'Lie flat on a bench while holding a dumbbell at arms length. Your arm should be perpendicular to your body. The palm of your hand should be facing towards your feet as a pronated grip is required to perform this exercise.\nPlace your non lifting hand on your bicep for support.\nSlowly begin to lower the dumbbell down as you breathe in.\nThen, begin lifting the dumbbell upward as you contract the triceps. Remember to breathe out during the concentric (lifting part of the exercise).\nRepeat until you have performed your set repetitions.\nSwitch arms and repeat the movement.', 'Tumbado en un banco plano, coge la mancuerna con agarre en pronación (palma hacia los pies) y estira el brazo sobre le pecho. Utiliza la otra mano para ejercer de apoyo o tope, colocándola detrás del codo y ejerciendo presión para mantener el otro brazo completamente recto. Desciende la mancuerna hacia el interior del pecho, []', 'triceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/One_Arm_Pronated_Dumbbell_Triceps_Extension/images/0.jpg', '/uploads/exercises/exercise_535.gif', NULL, '2026-07-13 22:23:41'),
(536, 'One Arm Supinated Dumbbell Triceps Extension', 'Extensión Horizontal Concentrada Superior con Mancuerna', 'Lie flat on a bench while holding a dumbbell at arms length. Your arm should be perpendicular to your body. The palm of your hand should be facing towards your face as a supinated grip is required to perform this exercise.\nPlace your non lifting hand on your bicep for support.\nSlowly begin to lower the dumbbell down as you breathe in.\nThen, begin lifting the dumbbell upward as you contract the triceps. Remember to breathe out during the concentric (lifting part of the exercise).\nRepeat until you have performed your set repetitions.\nSwitch arms and repeat the movement.\nSwitch arms again and repeat the movement.', 'Tumbado en un banco plano, coge la mancuerna con agarre neutro (palma hacia el interior) y estira el brazo sobre le pecho. Utiliza la otra mano para ejercer de apoyo o tope, colocándola detrás del codo y ejerciendo presión para mantener el otro brazo completamente recto. Desciende la mancuerna flexionando el codo 90º, de forma []', 'triceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/One_Arm_Supinated_Dumbbell_Triceps_Extension/images/0.jpg', '/uploads/exercises/exercise_536.gif', NULL, '2026-07-13 22:23:41'),
(540, 'One Leg Barbell Squat', 'Sentadilla a una pierna con Barra', 'Start by standing about 2 to 3 feet in front of a flat bench with your back facing the bench. Have a barbell in front of you on the floor. Tip: Your feet should be shoulder width apart from each other.\nBend the knees and use a pronated grip with your hands being wider than shoulder width apart from each other to lift the barbell up until you can rest it on your chest.\nThen lift the barbell over your head and rest it on the base of your neck. Move one foot back so that your toe is resting on the flat bench. Your other foot should be stationary in front of you. Keep your head up at all times as looking down will get you off balance and also maintain a straight back. Tip: Make sure your back is straight and chest is out while performing this exercise.\nAs you inhale, slowly lower your leg until your thigh is parallel to the floor. At this point, your knee should be over your toes. Your chest should be directly above the middle of your thigh.\nLeading with the chest and hips and contracting the quadriceps, elevate your leg back to the starting position as you exhale.\nRepeat for the recommended amount of repetitions.\nSwitch legs and repeat the movement.', 'De pie con una barra tras la nuca, con las manos en ella a los lados de los hombros mirando hacia delante, ponte delante de un banco o silla. Lleva una pierna hacia atrás y apoya el empeine del pie en el borde del banco para mantener el equilibrio. Esta pierna no debe ejercer ningún []', 'quadriceps', 'Pierna', 'Cuádriceps', '[\"Glúteo\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/One_Leg_Barbell_Squat/images/0.jpg', '/uploads/exercises/exercise_540.gif', NULL, '2026-07-13 22:23:41'),
(569, 'Plyo Push-up', 'Flexiones Pliométricas', 'Move into a prone position on the floor, supporting your weight on your hands and toes.\nYour arms should be fully extended with the hands around shoulder width. Keep your body straight throughout the movement. This will be your starting position.\nDescend by flexing at the elbow, lowering your chest towards the ground.\nAt the bottom, reverse the motion by pushing yourself up through elbow extension as quickly as possible. Attempt to push your upper body up until your hands leave the ground.\nReturn to the starting position and repeat the exercise.\nFor added difficulty, add claps into the movement while you are air borne.', 'Comienza en una plancha alta o en la parte superior de la posición de flexión. El torso debe estar en línea recta, con el núcleo apretado y las palmas directamente debajo de los hombros. Empieza a bajar el cuerpo como si fueras a hacer una lagartija hasta que tu pecho casi toque el suelo. A []', 'chest', 'Pecho', 'Pecho', '[\"Cardio\",\"Full Body\"]', 1, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Plyo_Push-up/images/0.jpg', '/uploads/exercises/exercise_569.gif', NULL, '2026-07-13 22:23:41');
INSERT INTO `exercises` (`id`, `name`, `name_es`, `description`, `description_es`, `target_muscle`, `target_muscle_es`, `primary_muscle`, `secondary_muscles`, `is_warmup`, `media_type`, `media_url`, `local_media_path`, `created_by_trainer_id`, `created_at`) VALUES
(588, 'Push-Up Wide', 'Flexiones Abiertas', 'With your hands wide apart, support your body on your toes and hands in a plank position. Your elbows should be extended and your body straight. Do not allow your hips to sag. This will be your starting position.\nTo begin, allow the elbows to flex, lowering your chest to the floor as you inhale.\nUsing your pectoral muscles, press your upper body back up to the starting position by extending the elbows. Exhale as you perform this step.\nAfter pausing at the contracted position, repeat the movement for the prescribed amount of repetitions.', 'Empezamos con el pecho y abdomen pegado al suelo y las manos apoyadas a la altura del pecho, a una anchura algo superior a la de los codos si estiramos los brazos a los lados. Subimos estirando los brazos con los codos en ángulo, estirando bien arriba. Al bajar tenemos que volver a tocar el []', 'chest', 'Pecho', 'Pecho', '[\"Full Body\",\"Cardio\",\"Tríceps\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Push-Up_Wide/images/0.jpg', '/uploads/exercises/exercise_588.gif', NULL, '2026-07-13 22:23:41'),
(604, 'Reverse Band Bench Press', 'Press Banca con Bandas', 'Position a bench inside a power rack, with the bar set to the correct height. Begin by anchoring bands either to band pegs or to the top of the rack. Ensure that you will be position properly under the bands. Attach the other end to the barbell.\nLie on the bench, tuck your feet underneath you and arch your back. Using the bar to help support your weight, lift your shoulder off the bench and retract them, squeezing the shoulder blades together. Use your feet to drive your traps into the bench. Maintain this tight body position throughout the movement. However wide your grip, it should cover the ring on the bar.\nPull the bar out of the rack without protracting your shoulders. Focus on squeezing the bar and trying to pull it apart. Lower the bar to your lower chest or upper stomach. The bar, wrist, and elbow should stay in line at all times.\nPause when the barbell touches your torso, and then drive the bar up with as much force as possible. The elbows should be tucked in until lockout.', 'Recostado sobre un banco horizontal, los brazos estirados verticalmente, con los extremos de las bandas agarrados, el movimiento consiste en bajar los brazos hasta la altura del torso y luego subir hasta la posición inicial​. Las manos están en pronación, es decir, las palmas hacia los pies (la amplitud del movimiento debe adaptarse según la []', 'triceps', 'Pecho', 'Pecho', '[\"Tríceps\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Reverse_Band_Bench_Press/images/0.jpg', '/uploads/exercises/exercise_604.gif', NULL, '2026-07-13 22:23:41'),
(609, 'Reverse Barbell Curl', 'Curl en Pronación Abierto con Barra', 'Stand up with your torso upright while holding a barbell at shoulder width with the elbows close to the torso. The palm of your hands should be facing down (pronated grip). This will be your starting position.\nWhile holding the upper arms stationary, curl the weights while contracting the biceps as you breathe out. Only the forearms should move. Continue the movement until your biceps are fully contracted and the bar is at shoulder level. Hold the contracted position for a second as you squeeze the muscle.\nSlowly begin to bring the bar back to starting position as your breathe in.\nRepeat for the recommended amount of repetitions.', 'De pie con la espalda recta y las piernas ligeramente separadas, coge la barra con las manos a una anchura superior a la de los hombros, con las palmas hacia abajo (pronación). Sube la barra flexionando los codos y desciende de forma controlada.', 'biceps', 'Bíceps', 'Antebrazo', '[\"Bíceps\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Reverse_Barbell_Curl/images/0.jpg', '/uploads/exercises/exercise_609.gif', NULL, '2026-07-13 22:23:41'),
(610, 'Reverse Barbell Preacher Curls', 'Curl en Supinación en banco Scott con Barra', 'Grab an EZ-bar using a shoulder width and palms down (pronated) grip.\nNow place the upper part of both arms on top of the preacher bench and have your arms extended. This will be your starting position.\nAs you exhale, use the biceps to curl the weight up until your biceps are fully contracted and the barbell is at shoulder height. Squeeze the biceps hard for a second at the contracted position.\nAs you breathe in, slowly lower the barbell until your upper arms are extended and the biceps is fully stretched.\nRepeat for the recommended amount of repetitions.', 'Sentado en el banco Scott con el pecho apoyado, coge la barra con las manos a la anchura de los hombros, con las palmas hacia arriba (supinación). Sube la barra flexionando los codos y desciende de forma controlada, con la parte superior de los brazos siempre bien apoyada en el banco.', 'biceps', 'Bíceps', 'Bíceps', '[\"Antebrazo\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Reverse_Barbell_Preacher_Curls/images/0.jpg', '/uploads/exercises/exercise_610.gif', NULL, '2026-07-13 22:23:41'),
(611, 'Reverse Cable Curl', 'Curl en Banco Scott en Pronación con Polea', 'Stand up with your torso upright while holding a bar attachment that is attached to a low pulley using a pronated (palms down) and shoulder width grip. Make sure also that you keep the elbows close to the torso. This will be your starting position.\nWhile holding the upper arms stationary, curl the weights while contracting the biceps as you breathe out. Only the forearms should move. Continue the movement until your biceps are fully contracted and the bar is at shoulder level. Hold the contracted position for a second as you squeeze the muscle.\nSlowly begin to bring the bar back to starting position as your breathe in.\nRepeat for the recommended amount of repetitions.', 'Sentado en el banco con el pecho apoyado, coge la polea con agarre en pronación (palmas hacia abajo). Apoya bien la parte trasera superior de los brazos en el banco scott y flexiona los codos subiendo la barra. Desciende lentamente sin llegar a estirar del todo.', 'biceps', 'Bíceps', 'Bíceps', '[\"Antebrazo\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Reverse_Cable_Curl/images/0.jpg', '/uploads/exercises/exercise_611.gif', NULL, '2026-07-13 22:23:41'),
(616, 'Reverse Grip Triceps Pushdown', 'Extensión Vertical en Supinación en Polea Alta', 'Start by setting a bar attachment (straight or e-z) on a high pulley machine.\nFacing the bar attachment, grab it with the palms facing up (supinated grip) at shoulder width. Lower the bar by using your lats until your arms are fully extended by your sides. Tip: Elbows should be in by your sides and your feet should be shoulder width apart from each other. This is the starting position.\nSlowly elevate the bar attachment up as you inhale so it is aligned with your chest. Only the forearms should move and the elbows/upper arms should be stationary by your side at all times.\nThen begin to lower the cable bar back down to the original staring position while exhaling and contracting the triceps hard.\nRepeat for the recommended amount of repetitions.', 'De pie con las piernas ligeramente separadas y la espalda recta de cara a la polea, coge la polea alta con las palmas hacia arriba y estira los brazos hacia abajo. Sube flexionando los codos de forma controlada sin llegar a relajar y vuelve a estirar.', 'triceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Reverse_Grip_Triceps_Pushdown/images/0.jpg', '/uploads/exercises/exercise_616.gif', NULL, '2026-07-13 22:23:41'),
(638, 'Russian Twist', 'Russian Twist', 'Lie down on the floor placing your feet either under something that will not move or by having a partner hold them. Your legs should be bent at the knees.\nElevate your upper body so that it creates an imaginary V-shape with your thighs. Your arms should be fully extended in front of you perpendicular to your torso and with the hands clasped. This is the starting position.\nTwist your torso to the right side until your arms are parallel with the floor while breathing out.\nHold the contraction for a second and move back to the starting position while breathing out. Now move to the opposite side performing the same techniques you applied to the right side.\nRepeat for the recommended amount of repetitions.', 'Siéntate en el suelo con las rodillas dobladas y los pies apoyados. Inclina ligeramente el torso hacia atrás. Junta las manos frente al pecho. Gira el torso hacia un lado y luego hacia el otro, acercando el codo de ese lado hacia el suelo. Mantén el equilibrio y repite alternando los lados. Este ejercicio trabaja []', 'abdominals', 'Abdomen', 'Core/Abdomen', '[]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Russian_Twist/images/0.jpg', '/uploads/exercises/exercise_638.gif', NULL, '2026-07-13 22:23:41'),
(645, 'Seated Barbell Twist', 'Giros de cintura sentado con Barra', 'Start out by sitting at the end of a flat bench with a barbell placed on top of your thighs. Your feet should be shoulder width apart from each other.\nGrip the bar with your palms facing down and make sure your hands are wider than shoulder width apart from each other. Begin to lift the barbell up over your head until your arms are fully extended.\nNow lower the barbell behind your head until it is resting along the base of your neck. This is the starting position.\nWhile keeping your feet and head stationary, move your waist from side to side so that your oblique muscles feel the contraction. Only move from side to side as far as your waist will allow you to go. Stretching or moving too far can cause an injury to occur. Tip: Use a slow and controlled motion.\nRemember to breathe out while twisting your body to the side and in when moving back to the starting position.\nRepeat for the recommended amount of repetitions.', 'Siéntate en un banco y con las piernas flexionadas y la espalda recta. Ponte una barra sobre el trapecio. Gira tu torso de lado a lado sin mover las piernas, apretando el abdomen.', 'abdominals', 'Abdomen', 'Core/Abdomen', '[]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Seated_Barbell_Twist/images/0.jpg', '/uploads/exercises/exercise_645.gif', NULL, '2026-07-13 22:23:41'),
(652, 'Seated Calf Raise', 'Extensión de Gemelos sentado en Máquina', 'Sit on the machine and place your toes on the lower portion of the platform provided with the heels extending off. Choose the toe positioning of your choice (forward, in, or out) as per the beginning of this chapter.\nPlace your lower thighs under the lever pad, which will need to be adjusted according to the height of your thighs. Now place your hands on top of the lever pad in order to prevent it from slipping forward.\nLift the lever slightly by pushing your heels up and release the safety bar. This will be your starting position.\nSlowly lower your heels by bending at the ankles until the calves are fully stretched. Inhale as you perform this movement.\nRaise the heels by extending the ankles as high as possible as you contract the calves and breathe out. Hold the top contraction for a second.\nRepeat for the recommended amount of repetitions.', 'Sentado, pon la parte delantera de los pies al borde de la plataforma y con los muslos bajo los soportes acolchados. Ponte de puntillas estirando bien los gemelos y desciende, repetidamente hasta terminar la serie. Carga el peso que consideres.', 'calves', 'Pierna', 'Gemelos', '[]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Seated_Calf_Raise/images/0.jpg', '/uploads/exercises/exercise_652.gif', NULL, '2026-07-13 22:23:41'),
(654, 'Seated Close-Grip Concentration Barbell Curl', 'Curl Concentrado Cerrado con Barra', 'Sit down on a flat bench with a barbell or E-Z Bar in front of you in between your legs. Your legs should be spread with the knees bent and the feet on the floor.\nUse your arms to pick the barbell up and place the back of your upper arms on top of your inner thighs (around three and a half inches away from the front of the knee). A supinated grip closer than shoulder width is needed to perform this exercise. Tip: Your arm should be extended at arms length and the barbell should be above the floor. This will be your starting position.\nWhile holding the upper arms stationary, curl the weights forward while contracting the biceps as you breathe out. Only the forearms should move. Continue the movement until your biceps are fully contracted and the dumbbells are at shoulder level. Hold the contracted position for a second as you squeeze the biceps.\nSlowly begin to bring the barbell back to starting position as your breathe in. Tip: Avoid swinging motions at any time.\nRepeat for the recommended amount of repetitions.', 'Sentado en un banco, coge la barra con las manos en supinación (palmas hacia arriba) a una anchura inferior a la de los hombros. Inclina el cuerpo hacia delante y abre las piernas, apoyando los codos en el borde del banco. Flexiona los codos y sube la barra hasta llegar casi a la cabeza. Desciende []', 'biceps', 'Bíceps', 'Bíceps', '[\"Antebrazo\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Seated_Close-Grip_Concentration_Barbell_Curl/images/0.jpg', '/uploads/exercises/exercise_654.gif', NULL, '2026-07-13 22:23:41'),
(659, 'Seated Dumbbell Press', 'Press Cubano con Mancuernas', 'Grab a couple of dumbbells and sit on a military press bench or a utility bench that has a back support on it as you place the dumbbells upright on top of your thighs.\nClean the dumbbells up one at a time by using your thighs to bring the dumbbells up to shoulder height at each side.\nRotate the wrists so that the palms of your hands are facing forward. This is your starting position.\nAs you exhale, push the dumbbells up until they touch at the top.\nAfter a second pause, slowly come down back to the starting position as you inhale.\nRepeat for the recommended amount of repetitions.', 'Sentado con la espalda recta, coge una mancuerna en cada mano en pronación (palmas hacia atrás) y flexiona los codos elevando las manos a la altura de los hombros. Una vez ahí realiza una rotación de los hombros de manera que las manos pasen de estar en dirección al suelo para estar hacia arriba de []', 'shoulders', 'Hombro', 'Hombros', '[\"Full Body\",\"Cardio\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Seated_Dumbbell_Press/images/0.jpg', '/uploads/exercises/exercise_659.gif', NULL, '2026-07-13 22:23:41'),
(668, 'Seated Leg Curl', 'Curl Femoral Vertical en Máquina', 'Adjust the machine lever to fit your height and sit on the machine with your back against the back support pad.\nPlace the back of lower leg on top of padded lever (just a few inches under the calves) and secure the lap pad against your thighs, just above the knees. Then grasp the side handles on the machine as you point your toes straight (or you can also use any of the other two stances) and ensure that the legs are fully straight right in front of you. This will be your starting position.\nAs you exhale, pull the machine lever as far as possible to the back of your thighs by flexing at the knees. Keep your torso stationary at all times. Hold the contracted position for a second.\nSlowly return to the starting position as you breathe in.\nRepeat for the recommended amount of repetitions.', 'Sentado con el respaldo algo inclinado y la espalda bien apoyada, con las rodillas libres y la parte trasera de los tobillos en el rodillo. Flexiona las rodillas hacia atrás 90°, manteniendo inmóvil la parte alta de la pierna. Vuelve de forma controlada sin relajar el músculo.', 'hamstrings', 'Pierna', 'Femoral', '[\"Gemelos\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Seated_Leg_Curl/images/0.jpg', '/uploads/exercises/exercise_668.gif', NULL, '2026-07-13 22:23:41'),
(700, 'Single-Arm Push-Up', 'Flexiones a una mano', 'Begin laying prone on the ground. Move yourself into a position supporting your weight on your toes and one arm. Your working arm should be placed directly under the shoulder, fully extended. Your legs should be extended, and for this movement you may need a wider base, placing your feet further apart than in a normal push-up.\nMaintain good posture, and place your free hand behind your back. This will be your starting position.\nLower yourself by allowing the elbow to flex until you touch the ground.\nDescend slowly, and reverse direction be extending the arm to return to the starting position.', 'La posición será como en una flexión normal, pero colocaremos solamente una mano en el suelo. Seguidamente, será importante intentar lograr una posición que nos permita mantenernos en equilibrio usando las piernas y el brazo de apoyo extendidos. El brazo que va a realizar la flexión estará a la altura del hombro, completamente extendido, y []', 'chest', 'Pecho', 'Pecho', '[\"Full Body\",\"Cardio\",\"Tríceps\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Single-Arm_Push-Up/images/0.jpg', '/uploads/exercises/exercise_700.gif', NULL, '2026-07-13 22:23:41'),
(729, 'Smith Machine Hip Raise', 'Crunch Inferior en Máquina Smith', 'Position a bench in the rack and load the bar to an appropriate weight. Lie down on the bench, placing the bottom of your feet against the bar. Unlock the bar and extend your legs. You may need to use your hands to assist you. For added stability grasp the sides of the Smith Machine. This will be your starting position.\nInitiate the movement by rotating your pelvis, flexing your spine to raise your hips off of the bench. Maintain a slight bend in the knees throughout the motion.\nAfter a brief pause, return the hips to the bench.\nRepeat for the desired number of repetitions.', 'Túmbate hacia arriba en el suelo bajo una máquina Smith. Estira las piernas hacia arriba y pon el centro de los pies en la barra, ligeramente separados. Eleva la cadera mediante la contracción abdominal inferior, levantando la barra. Baja lentamente y sube de nuevo sin flexionar las piernas.', 'abdominals', 'Abdomen', 'Core/Abdomen', '[]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Smith_Machine_Hip_Raise/images/0.jpg', '/uploads/exercises/exercise_729.gif', NULL, '2026-07-13 22:23:41'),
(766, 'Standing Barbell Calf Raise', 'Extensión de Gemelos de pie con Barra', 'This exercise is best performed inside a squat rack for safety purposes. To begin, first set the bar on a rack that best matches your height. Once the correct height is chosen and the bar is loaded, step under the bar and place the bar on the back of your shoulders (slightly below the neck).\nHold on to the bar using both arms at each side and lift it off the rack by first pushing with your legs and at the same time straightening your torso.\nStep away from the rack and position your legs using a shoulder width medium stance with the toes slightly pointed out. Keep your head up at all times as looking down will get you off balance and also maintain a straight back. The knees should be kept with a slight bend; never locked. This will be your starting position. Tip: For better range of motion you may also place the ball of your feet on a wooden block but be careful as this option requires more balance and a sturdy block.\nRaise your heels as you breathe out by extending your ankles as high as possible and flexing your calf. Ensure that the knee is kept stationary at all times. There should be no bending at any time. Hold the contracted position by a second before you start to go back down.\nGo back slowly to the starting position as you breathe in by lowering your heels as you bend the ankles until calves are stretched.\nRepeat for the recommended amount of repetitions.', 'De pie con las piernas separadas a la anchura de los hombros coge una barra sobre el trapecio, ayudando a mantenerla con las manos a los lados de los hombros. Pon la parte delantera de los pies al borde de un step o plataforma. Ponte de puntillas estirando bien los gemelos y desciende, repetidamente hasta []', 'calves', 'Pierna', 'Gemelos', '[]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Standing_Barbell_Calf_Raise/images/0.jpg', '/uploads/exercises/exercise_766.gif', NULL, '2026-07-13 22:23:41'),
(767, 'Standing Barbell Press Behind Neck', 'Press Militar Trasero con Barra', 'This exercise is best performed inside a squat rack for easier pick up of the bar. To begin, first set the bar on a rack that best matches your height. Once the correct height is chosen and the bar is loaded, step under the bar and place the back of your shoulders (slightly below the neck) across it.\nHold on to the bar using both arms at each side and lift it off the rack by first pushing with your legs and at the same time straightening your torso.\nStep away from the rack and position your legs using a shoulder width medium stance with the toes slightly pointed out. Your back should be kept straight while performing this exercise. This will be your starting position.\nElevate the barbell overhead by fully extending your arms while breathing out.\nHold the contraction for a second and lower the barbell back down to the starting position by inhaling.\nRepeat for the recommended amount of repetitions.', 'De pie con las piernas separadas y la espalda recta, coge una barra por delante del cuerpo con las manos en pronación (palmas hacia atrás) a una anchura superior a la de los hombros. Levanta la barra volteando los brazos (las palmas que queden hacia delante). Sube la barra estirando bien los brazos y desciende []', 'shoulders', 'Hombro', 'Hombros', '[\"Tríceps\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Standing_Barbell_Press_Behind_Neck/images/0.jpg', '/uploads/exercises/exercise_767.gif', NULL, '2026-07-13 22:23:41'),
(772, 'Standing Bradford Press', 'Press Militar Mixto con Barra', 'Place a loaded bar at shoulder level in a rack. With a pronated grip at shoulder width, begin with the bar racked across the front of your shoulders. This is your starting position.\nInitiate the lift by extending the elbows to press the bar overhead. Avoid locking out the elbow as you move the weight behind your head.\nLower the bar down to the back of the head until your elbow forms a right angle.\nLift the bar back over your head by extending the elbows\nLower the bar down to the starting position.\nAlternate in this manner until you complete the recommended amount of repetitions.', 'De pie con las piernas separadas y la espalda recta, coge una barra por delante del cuerpo con las manos en pronación (palmas hacia atrás) a Una anchura algo mayor a la de los hombros. Levanta la barra hasta arriba del pecho volteando los brazos (las palmas que queden hacia delante). Sube la barra estirando []', 'shoulders', 'Hombro', 'Hombros', '[\"Tríceps\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Standing_Bradford_Press/images/0.jpg', '/uploads/exercises/exercise_772.gif', NULL, '2026-07-13 22:23:41'),
(774, 'Standing Cable Lift', 'Extensión Diagonal en Polea Baja', 'Connect a standard handle on a tower, and move the cable to the lowest pulley position.\nWith your side to the cable, grab the handle with one hand and step away from the tower. You should be approximately arm\'s length away from the pulley, with the tension of the weight on the cable. Your outstretched arm should be aligned with the cable.\nWith your feet positioned shoulder width apart, squat down and grab the handle with both hands. Your arms should still be fully extended.\nIn one motion, pull the handle up and across your body until your arms are in a fully-extended position above your head.\nKeep your back straight and your arms close to your body as you pivot your back foot and straighten your legs to get a full range of motion.\nRetract your arms and then your body. Return to the neutral position in a slow and controlled manner.\nRepeat to failure.\nThen, reposition and repeat the same series of movements on the opposite side.', 'De pie al lado de una polea con las piernas ligeramente separadas y la espalda recta, coge el agarre con las dos manos entrelazadas y ponlo frente al lado de la cadera más cercano a la polea. Realiza una extensión elevando los brazos semiflexionados en diagonal hacia arriba, haciendo un giro del torso para mayor []', 'abdominals', 'Espalda', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Standing_Cable_Lift/images/0.jpg', '/uploads/exercises/exercise_774.gif', NULL, '2026-07-13 22:23:41'),
(777, 'Standing Concentration Curl', 'Curl Aislado hacia abajo con Mancuerna', 'Taking a dumbbell in your working hand, lean forward. Allow your working arm to hang perpendicular to the ground with the elbow pointing out. This will be your starting position.\nFlex the elbow to curl the weight, keeping the upper arm stationary. At the top of the repetition, flex the biceps and pause.\nLower the dumbbell back to the starting position.\nRepeat the movement for the prescribed amount of repetitions.', 'De pie con las piernas separadas, inclínate hacia delante con la espalda paralela al suelo. Coge una mancuerna con una mano y con la palma hacia el interior. Flexiona el codo llevando la mancuerna frente al pectoral opuesto y desciende nuevamente de forma controlada. Al terminar la serie cambia de brazo.', 'biceps', 'Bíceps', 'Bíceps', '[]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Standing_Concentration_Curl/images/0.jpg', '/uploads/exercises/exercise_777.gif', NULL, '2026-07-13 22:23:41'),
(778, 'Standing Dumbbell Calf Raise', 'Extensión de Gemelos de pie con Mancuernas', 'Stand with your torso upright holding two dumbbells in your hands by your sides. Place the ball of the foot on a sturdy and stable wooden board (that is around 2-3 inches tall) while your heels extend off and touch the floor. This will be your starting position.\nWith the toes pointing either straight (to hit all parts equally), inwards (for emphasis on the outer head) or outwards (for emphasis on the inner head), raise the heels off the floor as you exhale by contracting the calves. Hold the top contraction for a second.\nAs you inhale, go back to the starting position by slowly lowering the heels.\nRepeat for the recommended amount of times.', 'De pie con los pies casi juntos, coge una mancuerna con cada mano. Pon la parte delantera de los pies al borde de un step o plataforma. Ponte de puntillas estirando bien los gemelos y desciende, repetidamente hasta terminar la serie.', 'calves', 'Pierna', 'Gemelos', '[]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Standing_Dumbbell_Calf_Raise/images/0.jpg', '/uploads/exercises/exercise_778.gif', NULL, '2026-07-13 22:23:41'),
(779, 'Standing Dumbbell Press', 'Press Militar en Pronación con Mancuernas', 'Standing with your feet shoulder width apart, take a dumbbell in each hand. Raise the dumbbells to head height, the elbows out and about 90 degrees. This will be your starting position.\nMaintaining strict technique with no leg drive or leaning back, extend through the elbow to raise the weights together directly above your head.\nPause, and slowly return the weight to the starting position.', 'De pie con la espalda recta y las piernas a la anchura de los hombros, coge una mancuerna con cada mano y ponlas a los lados de la cabeza con los brazos flexionados y con agarre en pronación (palmas hacia abajo). Levanta las mancuernas hacia arriba estirando bien los brazos y vuelve a bajar de []', 'shoulders', 'Hombro', 'Hombros', '[\"Tríceps\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Standing_Dumbbell_Press/images/0.jpg', '/uploads/exercises/exercise_779.gif', NULL, '2026-07-13 22:23:41'),
(783, 'Standing Dumbbell Upright Row', 'Remo al mentón con Mancuernas', 'Grasp a dumbbell in each hand with a pronated (palms forward) grip that is slightly less than shoulder width. The dumbbells should be resting on top of your thighs. Your arms should be extended with a slight bend at the elbows and your back should be straight. This will be your starting position.\nUse your side shoulders to lift the dumbbells as you exhale. The dumbbells should be close to the body as you move it up and the elbows should drive the motion. Continue to lift them until they nearly touch your chin. Tip: Your elbows should drive the motion. As you lift the dumbbells, your elbows should always be higher than your forearms. Also, keep your torso stationary and pause for a second at the top of the movement.\nLower the dumbbells back down slowly to the starting position. Inhale as you perform this portion of the movement.\nRepeat for the recommended amount of repetitions.', 'De pie coge las mancuernas con agarre en pronación (palmas hacia atrás) por delante del cuerpo. Eleva las mancuernas hacia el mentón, aguanta un segundo y vuelve a bajar de forma controlada. La espalda siempre recta y sin ningún tipo de balanceo corporal.', 'traps', 'Hombro', 'Hombros', '[\"Trapecio\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Standing_Dumbbell_Upright_Row/images/0.jpg', '/uploads/exercises/exercise_783.gif', NULL, '2026-07-13 22:23:41'),
(785, 'Standing Front Barbell Raise Over Head', 'Elevación Completa con Barra', 'To begin, stand straight with a barbell in your hands. You should grip the bar with palms facing down and a closer than shoulder width grip apart from each other.\nYour feet should be shoulder width apart from each other. Your elbows should be slightly bent. This is the starting position.\nLift the barbell up until it is directly over your head while exhaling. Make sure to keep your elbows slightly bent when performing each repetition.\nOnce you feel the contraction, begin to lower the barbell back down to the starting position as you inhale.\nRepeat for the recommended amount of repetitions.', 'De pie con la espalda recta y las piernas ligeramente separadas, coge la barra con las manos en pronación (palmas hacia abajo) a la anchura de los hombros. Con los brazos estirados, eleva la barra frontalmente hasta tenerla sobre la cabeza. Desciende de nuevo de forma controlada.', 'shoulders', 'Hombro', 'Hombros', '[\"Full Body\",\"Cardio\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Standing_Front_Barbell_Raise_Over_Head/images/0.jpg', '/uploads/exercises/exercise_785.gif', NULL, '2026-07-13 22:23:41'),
(792, 'Standing Leg Curl', 'Curl Femoral Vertical en Polea', 'Adjust the machine lever to fit your height and lie with your torso bent at the waist facing forward around 30-45 degrees (since an angled position is more favorable for hamstrings recruitment) with the pad of the lever on the back of your right leg (just a few inches under the calves) and the front of the right leg on top of the machine pad.\nKeeping the torso bent forward, ensure your leg is fully stretched and grab the side handles of the machine. Position your toes straight. This will be your starting position.\nAs you exhale, curl your right leg up as far as possible without lifting the upper leg from the pad. Once you hit the fully contracted position, hold it for a second.\nAs you inhale, bring the legs back to the initial position. Repeat for the recommended amount of repetitions.\nPerform the same exercise now for the left leg.', 'De pie de cara a la polea baja con las piernas casi juntas, ponte la correa en un tobillo. Flexiona la rodilla hacia atrás 90°, manteniendo inmóvil la parte alta de la pierna. Vuelve de forma controlada sin relajar el músculo.', 'hamstrings', 'Pierna', 'Femoral', '[]', 1, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Standing_Leg_Curl/images/0.jpg', '/uploads/exercises/exercise_792.gif', NULL, '2026-07-13 22:23:41'),
(796, 'Standing Military Press', 'Press Militar con Barra', 'Start by placing a barbell that is about chest high on a squat rack. Once you have selected the weights, grab the barbell using a pronated (palms facing forward) grip. Make sure to grip the bar wider than shoulder width apart from each other.\nSlightly bend the knees and place the barbell on your collar bone. Lift the barbell up keeping it lying on your chest. Take a step back and position your feet shoulder width apart from each other.\nOnce you pick up the barbell with the correct grip length, lift the bar up over your head by locking your arms. Hold at about shoulder level and slightly in front of your head. This is your starting position.\nLower the bar down to the collarbone slowly as you inhale.\nLift the bar back up to the starting position as you exhale.\nRepeat for the recommended amount of repetitions.', 'De pie con las piernas separadas y la espalda recta, coge una barra por delante del cuerpo con las manos en pronación (palmas hacia atrás) a la anchura aproximada de los hombros. Levanta la barra hasta arriba del pecho volteando los brazos (las palmas que queden hacia delante). Sube la barra estirando bien los brazos []', 'shoulders', 'Hombro', 'Hombros', '[\"Full Body\",\"Cardio\",\"Tríceps\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Standing_Military_Press/images/0.jpg', '/uploads/exercises/exercise_796.gif', NULL, '2026-07-13 22:23:41'),
(798, 'Standing One-Arm Cable Curl', 'Curl Aislado en Supinación en Polea Baja', 'Start out by grabbing single handle next to the low pulley machine. Make sure you are far enough from the machine so that your arm is supporting the weight.\nMake sure that your upper arm is stationary, perpendicular to the floor with elbows in and palms facing forward. Your non lifting arm should be grabbing your waist. This will allow you to keep your balance.\nSlowly begin to curl the single handle upwards while keeping the upper arm stationary until your forearm touches your bicep while exhaling. Tip: Only the forearm should move.\nHold the contraction position as you squeeze the bicep and then lower the single handle back down to the starting position as you inhale.\nRepeat for the recommended amount of repetitions.\nSwitch arms while performing this exercise.', 'De pie con la espalda recta, coge la polea baja con una mano y la palma hacia delante (supinación). Ponte de cara a la polea con las piernas ligeramente separadas. Flexiona el codo subiendo la mano hasta el pecho, sin mover el brazo. Desciende de forma controlada. Al terminar la serie cambia de brazo.', 'biceps', 'Bíceps', 'Bíceps', '[\"Antebrazo\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Standing_One-Arm_Cable_Curl/images/0.jpg', '/uploads/exercises/exercise_798.gif', NULL, '2026-07-13 22:23:41'),
(803, 'Standing Palms-In Dumbbell Press', 'Press Militar Neutro con Mancuernas', 'Start by having a dumbbell in each hand with your arm fully extended to the side using a neutral grip. Your feet should be shoulder width apart from each other. Now slowly lift the dumbbells up until you create a 90 degree angle with your arms. Note: Your forearms should be perpendicular to the floor. This the starting position.\nContinue to maintain a neutral grip throughout the entire exercise. Slowly lift the dumbbells up until your arms are fully extended.\nWhile inhaling lower the weights down until your arm is at a 90 degree angle again.\nRepeat for the recommended amount of repetitions.', 'De pie con la espalda recta y las piernas ligeramente separadas, coge una mancuerna con cada mano y ponlas frente a los hombros con los codos flexionados y con agarre neutro (palmas hacia dentro). Levanta las mancuernas hacia arriba estirando bien los brazos y vuelve a bajar de forma controlada.', 'shoulders', 'Hombro', 'Hombros', '[\"Tríceps\"]', 1, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Standing_Palms-In_Dumbbell_Press/images/0.jpg', '/uploads/exercises/exercise_803.gif', NULL, '2026-07-13 22:23:41'),
(816, 'Stiff Leg Barbell Good Morning', 'Buenos días con Barra', 'This exercise is best performed inside a squat rack for safety purposes. To begin, first set the bar on a rack that best matches your height. Once the correct height is chosen and the bar is loaded, step under the bar and place the back of your shoulders (slightly below the neck) across it.\nHold on to the bar using both arms at each side and lift it off the rack by first pushing with your legs and at the same time straightening your torso.\nStep away from the rack and position your legs using a shoulder width medium stance. Keep your head up at all times as looking down will get you off balance and also maintain a straight back. This will be your starting position.\nKeeping your legs stationary, move your torso forward by bending at the hips while inhaling. Lower your torso until it is parallel with the floor.\nBegin to raise the bar as you exhale by elevating your torso back to the starting position.\nRepeat for the recommended amount of repetitions.', 'Colócate de pie con las piernas separadas a la anchura algo menor a la de los hombros. Así, coge una barra tras la cabeza, exactamente bajo la zona de los trapecios. Baja el tronco hacia adelante, siempre manteniendo la espalda en una posición erecta. Al llegar al punto máximo, tu torso debe encontrarse casi paralelo []', 'lower back', 'Pierna', 'Glúteo', '[\"Femoral\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Stiff_Leg_Barbell_Good_Morning/images/0.jpg', '/uploads/exercises/exercise_816.gif', NULL, '2026-07-13 22:23:41'),
(818, 'Straight-Arm Dumbbell Pullover', 'Pullover con Mancuerna', 'Place a dumbbell standing up on a flat bench.\nEnsuring that the dumbbell stays securely placed at the top of the bench, lie perpendicular to the bench (torso across it as in forming a cross) with only your shoulders lying on the surface. Hips should be below the bench and legs bent with feet firmly on the floor. The head will be off the bench as well.\nGrasp the dumbbell with both hands and hold it straight over your chest at arms length. Both palms should be pressing against the underside one of the sides of the dumbbell. This will be your starting position.\nCaution: Always ensure that the dumbbell used for this exercise is secure. Using a dumbbell with loose plates can result in the dumbbell falling apart and falling on your face.\nWhile keeping your arms straight, lower the weight slowly in an arc behind your head while breathing in until you feel a stretch on the chest.\nAt that point, bring the dumbbell back to the starting position using the arc through which the weight was lowered and exhale as you perform this movement.\nHold the weight on the initial position for a second and repeat the motion for the prescribed number of repetitions.', 'Apoya la parte superior de la espalda sobre un banco plano, con las piernas flexionadas apoyadas en el suelo y la cadera hacia abajo. Coge una mancuerna con ambas manos con los dedos entrelazados. Estira los brazos con la mancuerna sobre el pecho. El movimiento consiste en realizar el descenso de los brazos estirados hasta []', 'chest', 'Espalda', 'Pecho', '[\"Dorsal\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Straight-Arm_Dumbbell_Pullover/images/0.jpg', '/uploads/exercises/exercise_818.gif', NULL, '2026-07-13 22:23:41'),
(819, 'Straight-Arm Pulldown', 'Serratos Inferiores con Barra en Polea', 'You will start by grabbing the wide bar from the top pulley of a pulldown machine and using a wider than shoulder-width pronated (palms down) grip. Step backwards two feet or so.\nBend your torso forward at the waist by around 30-degrees with your arms fully extended in front of you and a slight bend at the elbows. If your arms are not fully extended then you need to step a bit more backwards until they are. Once your arms are fully extended and your torso is slightly bent at the waist, tighten the lats and then you are ready to begin.\nWhile keeping the arms straight, pull the bar down by contracting the lats until your hands are next to the side of the thighs. Breathe out as you perform this step.\nWhile keeping the arms straight, go back to the starting position while breathing in.\nRepeat for the recommended amount of repetitions.', 'De pie, con los pies separados a la anchura de los hombros y las piernas ligeramente flexionadas. Extiende los brazos cogiendo la barra de la polea alta con las palmas hacia abajo, manteniendo la espalda recta. Lleva la barra a la altura del abdomen (posición inicial). Desde ahí, bájala hasta los muslos y vuelve a []', 'lats', 'Espalda', 'Espalda', '[\"Hombros\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Straight-Arm_Pulldown/images/0.jpg', '/uploads/exercises/exercise_819.gif', NULL, '2026-07-13 22:23:41'),
(849, 'Triceps Pushdown - V-Bar Attachment', 'Extensión Vertical en Pronación en Polea Alta', 'Attach a V-Bar to a high pulley and grab with an overhand grip (palms facing down) at shoulder width.\nStanding upright with the torso straight and a very small inclination forward, bring the upper arms close to your body and perpendicular to the floor. The forearms should be pointing up towards the pulley as they hold the bar. The thumbs should be higher than the small finger. This is your starting position.\nUsing the triceps, bring the bar down until it touches the front of your thighs and the arms are fully extended perpendicular to the floor. The upper arms should always remain stationary next to your torso and only the forearms should move. Exhale as you perform this movement.\nAfter a second hold at the contracted position, bring the V-Bar slowly up to the starting point. Breathe in as you perform this step.\nRepeat for the recommended amount of repetitions.', 'De pie con las piernas ligeramente separadas y la espalda recta de cara a la polea, coge la barra en pronación (palmas hacia abajo) y estira los brazos hacia abajo. Sube flexionando los codos de forma controlada sin llegar a relajar y vuelve a estirar.', 'triceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Triceps_Pushdown_-_V-Bar_Attachment/images/0.jpg', '/uploads/exercises/exercise_849.gif', NULL, '2026-07-13 22:23:42'),
(862, 'Upright Barbell Row', 'Remo al mentón Cerrado con Barra Z', 'Grasp a barbell with an overhand grip that is slightly less than shoulder width. The bar should be resting on the top of your thighs with your arms extended and a slight bend in your elbows. Your back should also be straight. This will be your starting position.\nNow exhale and use the sides of your shoulders to lift the bar, raising your elbows up and to the side. Keep the bar close to your body as you raise it. Continue to lift the bar until it nearly touches your chin. Tip: Your elbows should drive the motion, and should always be higher than your forearms. Remember to keep your torso stationary and pause for a second at the top of the movement.\nLower the bar back down slowly to the starting position. Inhale as you perform this portion of the movement.\nRepeat for the recommended amount of repetitions.', 'De pie coge la barra con agarre en pronación, por la parte más interna de la barra z. Eleva la barra hacia el mentón pero sin llegar a tocarlo, sacando los codos, aguanta un segundo y vuelve a bajar de forma controlada. La espalda siempre recta y sin ningún tipo de balanceo corporal.', 'shoulders', 'Hombro', 'Trapecio', '[\"Hombros\",\"Espalda\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Upright_Barbell_Row/images/0.jpg', '/uploads/exercises/exercise_862.gif', NULL, '2026-07-13 22:23:42'),
(863, 'Upright Cable Row', 'Remo al mentón en Polea', 'Grasp a straight bar cable attachment that is attached to a low pulley with a pronated (palms facing your thighs) grip that is slightly less than shoulder width. The bar should be resting on top of your thighs. Your arms should be extended with a slight bend at the elbows and your back should be straight. This will be your starting position.\nUse your side shoulders to lift the cable bar as you exhale. The bar should be close to the body as you move it up. Continue to lift it until it nearly touches your chin. Tip: Your elbows should drive the motion. As you lift the bar, your elbows should always be higher than your forearms. Also, keep your torso stationary and pause for a second at the top of the movement.\nLower the bar back down slowly to the starting position. Inhale as you perform this portion of the movement.\nRepeat for the recommended amount of repetitions.', 'De pie coge la barra con agarre en pronación, con agarre algo más ancho de los hombros. Eleva la barra hacia el mentón pero sin llegar a tocarlo, aguanta un segundo y vuelve a bajar de forma controlada. La espalda siempre recta y sin ningún tipo de balanceo corporal.', 'traps', 'Hombro', 'Hombros', '[\"Espalda\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Upright_Cable_Row/images/0.jpg', '/uploads/exercises/exercise_863.gif', NULL, '2026-07-13 22:23:42'),
(879, 'Wide-Grip Barbell Bench Press', 'Press Banca Abierto Inverso con Barra', 'Lie back on a flat bench with feet firm on the floor. Using a wide, pronated (palms forward) grip that is around 3 inches away from shoulder width (for each hand), lift the bar from the rack and hold it straight over you with your arms locked. The bar will be perpendicular to the torso and the floor. This will be your starting position.\nAs you breathe in, come down slowly until you feel the bar on your middle chest.\nAfter a second pause, bring the bar back to the starting position as you breathe out and push the bar using your chest muscles. Lock your arms and squeeze your chest in the contracted position, hold for a second and then start coming down slowly again. Tip: It should take at least twice as long to go down than to come up.\nRepeat the movement for the prescribed amount of repetitions.', 'Tumbado sobre un banco horizontal, los brazos estirados verticalmente, agarramos la barra con las manos en supinación (palmas hacia la cabeza) y lo más abiertas posible dentro de una posición cómoda para las muñecas. El movimiento consiste en bajar la barra hasta el pecho, sin descansar abajo, y luego subir hasta la posición inicial​. La []', 'chest', 'Pecho', 'Pecho', '[\"Hombros\",\"Tríceps\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Wide-Grip_Barbell_Bench_Press/images/0.jpg', '/uploads/exercises/exercise_879.gif', NULL, '2026-07-13 22:23:42'),
(880, 'Wide-Grip Decline Barbell Bench Press', 'Press Declinado con Barra', 'Lie back on a decline bench with the feet securely locked at the front of the bench. Using a wide, pronated (palms forward) grip that is around 3 inches away from shoulder width (for each hand), lift the bar from the rack and hold it straight over you with your arms locked. The bar will be perpendicular to the torso and the floor. This will be your starting position.\nAs you breathe in, come down slowly until you feel the bar on your lower chest.\nAfter a second pause, bring the bar back to the starting position as you breathe out and push the bar using your chest muscles. Lock your arms and squeeze your chest in the contracted position, hold for a second and then start coming down slowly again. Tip: It should take at least twice as long to go down than to come up.\nRepeat the movement for the prescribed amount of repetitions.', 'Tumbado sobre un banco inclinado, los brazos estirados verticalmente, agarramos la barra con las manos en pronación y un poco más abiertas de la anchura de los hombros. El movimiento consiste en bajar la barra hasta el pecho, sin descansar abajo, y luego subir hasta la posición inicial​. La inspiración se hace durante el descenso, []', 'chest', 'Pecho', 'Pecho', '[\"Tríceps\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Wide-Grip_Decline_Barbell_Bench_Press/images/0.jpg', '/uploads/exercises/exercise_880.gif', NULL, '2026-07-13 22:23:42');
INSERT INTO `exercises` (`id`, `name`, `name_es`, `description`, `description_es`, `target_muscle`, `target_muscle_es`, `primary_muscle`, `secondary_muscles`, `is_warmup`, `media_type`, `media_url`, `local_media_path`, `created_by_trainer_id`, `created_at`) VALUES
(881, 'Wide-Grip Decline Barbell Pullover', 'Pullover Declinado con Barra', 'Lie down on a decline bench with both legs securely locked in position. Reach for the barbell behind the head using a pronated grip (palms facing out). Make sure to grab the barbell wider than shoulder width apart for this exercise. Slowly lift the barbell up from the floor by using your arms.\nWhen positioned properly, your arms should be fully extended and perpendicular to the floor. This is the starting position.\nBegin by moving the barbell back down in a semicircular motion as if you were going to place it on the floor, but instead, stop when the arms are parallel to the floor. Tip: Keep the arms fully extended at all times. The movement should only happen at the shoulder joint. Inhale as you perform this portion of the movement.\nNow bring the barbell up while exhaling until you are back at the starting position. Remember to keep full control of the barbell at all times.\nRepeat the movement for the prescribed amount of repetitions of your training program.\nWhen finished with your set, slowly lower the barbell back down until it is level with your head and release it.', 'Tumbado sobre un banco plano, agarra la barra con las manos a una anchura un poco mayor que los hombros, en pronación (palma de la mano hacia los pies). Con los brazos estirados, llévalos hacia atrás de la cabeza. Una vez abajo, vuelve a subir la barra con los brazos extendidos sobre el pecho. Se []', 'chest', 'Pecho', 'Dorsal', '[\"Espalda\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Wide-Grip_Decline_Barbell_Pullover/images/0.jpg', '/uploads/exercises/exercise_881.gif', NULL, '2026-07-13 22:23:42'),
(884, 'Wide-Grip Rear Pull-Up', 'Dominada Trasera', 'Grab the pull-up bar with the palms facing forward using a wide grip.\nAs you have both arms extended in front of you holding the bar, bring your torso forward and head so that there is an imaginary line from the pull-up bar to the back of your neck. This is your starting position.\nPull your torso up until the bar is near the back of your neck. To do this, draw the shoulders and upper arms down and back while slightly leaning your head forward. Exhale as you perform this portion of the movement. Tip: Concentrate on squeezing the back muscles once you reach the full contracted position. The upper torso should remain stationary as it moves through space and only the arms should move. The forearms should do no other work other than hold the bar.\nAfter a second on the contracted position, start to inhale and slowly lower your torso back to the starting position when your arms are fully extended and the lats are fully stretched.\nRepeat this motion for the prescribed amount of repetitions.', 'Colgado en una barra de dominadas con las manos a una anchura algo mayor que la de los hombros y las palmas hacia delante, sube el cuerpo mediante la flexión de los brazos hasta dejar la barra tras la cabeza. Desciende lentamente.', 'lats', 'Espalda', 'Dorsal', '[\"Espalda\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Wide-Grip_Rear_Pull-Up/images/0.jpg', '/uploads/exercises/exercise_884.gif', NULL, '2026-07-13 22:23:42'),
(885, 'Wide-Grip Standing Barbell Curl', 'Curl en Supinación Abierto Con Barra', 'Stand up with your torso upright while holding a barbell at the wide outer handle. The palm of your hands should be facing forward. The elbows should be close to the torso. This will be your starting position.\nWhile holding the upper arms stationary, curl the weights forward while contracting the biceps as you breathe out. Tip: Only the forearms should move.\nContinue the movement until your biceps are fully contracted and the bar is at shoulder level. Hold the contracted position for a second and squeeze the biceps hard.\nSlowly begin to bring the bar back to starting position as your breathe in.\nRepeat for the recommended amount of repetitions.', 'De pie con la espalda recta y las piernas ligeramente separadas, coge la barra con las manos a una anchura superior a la de los hombros, con las palmas hacia arriba (supinación). Sube la barra flexionando los codos y desciende de forma controlada.', 'biceps', 'Bíceps', 'Bíceps', '[\"Braquial\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Wide-Grip_Standing_Barbell_Curl/images/0.jpg', '/uploads/exercises/exercise_885.gif', NULL, '2026-07-13 22:23:42'),
(886, 'Wide Stance Barbell Squat', 'Sentadilla Sumo con Barra', 'This exercise is best performed inside a squat rack for safety purposes. To begin, first set the bar on a rack that best matches your height. Once the correct height is chosen and the bar is loaded, step under the bar and place the back of your shoulders (slightly below the neck) across it.\nHold on to the bar using both arms at each side and lift it off the rack by first pushing with your legs and at the same time straightening your torso.\nStep away from the rack and position your legs using a wider-than-shoulder-width stance with the toes slightly pointed out. Keep your head up at all times as looking down will get you off balance, and also maintain a straight back. This will be your starting position.\nBegin to slowly lower the bar by bending the knees as you maintain a straight posture with the head up. Continue down until the angle between the upper leg and the calves becomes slightly less than 90-degrees (which is the point in which the upper legs are below parallel to the floor). Inhale as you perform this portion of the movement. Tip: If you performed the exercise correctly, the front of the knees should make an imaginary straight line with the toes that is perpendicular to the front. If your knees are past that imaginary line (if they are past your toes) then you are placing undue stress on the knee and the exercise has been performed incorrectly.\nBegin to raise the bar as you exhale by pushing the floor with the heel of your foot as you straighten the legs again and go back to the starting position.\nRepeat for the recommended amount of repetitions.', 'De pie con las piernas separadas a una anchura muy superior a la de los hombros coge una barra sobre el trapecio, ayudando a mantenerla con las manos a los lados de los hombros. Desciende flexionando las rodillas 90º, sin descansar abajo, subiendo de nuevo y estirando bien arriba.', 'quadriceps', 'Pierna', 'Glúteo', '[\"Cuádriceps\",\"Femoral\"]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Wide_Stance_Barbell_Squat/images/0.jpg', '/uploads/exercises/exercise_886.gif', NULL, '2026-07-13 22:23:42'),
(889, 'Wind Sprints', 'Elevación de piernas alternas Colgado', 'Hang from a pull-up bar using a pronated grip. Your arms and legs should be extended. This will be your starting position.\nBegin by quickly raising one knee as high as you can. Do not swing your body or your legs. 3\nImmediately reverse the motion, returning that leg to the starting position. Simultaneously raise the opposite knee as high as possible.\nContinue alternating between legs until the set is complete.', 'Cuélgate de una barra de dominadas con las manos hacia delante a una anchura algo superior a la de los hombros. Flexiona las rodillas a 90º y eleva una hacia delante, mediante la contracción del abdomen hasta tener la rodilla a la altura de la cadera. Desciende de forma controlada mientras subes la otra pierna. []', 'abdominals', 'Abdomen', 'Core/Abdomen', '[]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Wind_Sprints/images/0.jpg', '/uploads/exercises/exercise_889.gif', NULL, '2026-07-13 22:23:42'),
(892, 'Wrist Roller', 'Wrist Roller', 'To begin, stand straight up grabbing a wrist roller using a pronated grip (palms facing down). Your feet should be shoulder width apart.\nSlowly lift both arms until they are fully extended and parallel to the floor in front of you. Note: Make sure the rope is not wrapped around the roller. Your entire body should be stationary except for the forearms. This is the starting position.\nRotate one wrist at a time in an upward motion to bring the weight up to the bar by rolling the rope around the roller.\nOnce the weight has reached the bar, slowly begin to lower the weight back down by rotating the wrist in a downward motion until the weight reaches the starting position.\nRepeat for the prescribed amount of repetitions in your program.', 'De pie, con los brazos estirados hacia delante, realizar la recogida de la cuerda con giro de las muñecas de una en una. Repetir cambiando el sentido. Podemos apoyar los antebrazos sobre una barra, por ejemplo en un rack.', 'forearms', 'Antebrazo', 'Antebrazo', '[]', 0, 'gif', 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Wrist_Roller/images/0.jpg', '/uploads/exercises/exercise_892.gif', NULL, '2026-07-13 22:23:42'),
(898, 'Burpees', NULL, 'flexion de pecho con salto', NULL, 'General', NULL, 'Cardio', '[\"Full Body\"]', 1, 'gif', 'https://fitcron.com/exercise/burpee-jack-cardio/', NULL, 1, '2026-07-18 12:32:52'),
(899, 'Crunch Inferior en círculos', 'Crunch Inferior en círculos', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Pierna\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_899.gif', NULL, '2026-07-18 19:14:17'),
(900, 'Crunch Superior Concentrado Elevado', 'Crunch Superior Concentrado Elevado', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_900.gif', NULL, '2026-07-18 19:14:23'),
(901, 'Crunch Cruzado estirado', 'Crunch Cruzado estirado', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_901.gif', NULL, '2026-07-18 19:14:29'),
(902, 'Crunch Inferior con flexión y extensión', 'Crunch Inferior con flexión y extensión', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_902.gif', NULL, '2026-07-18 19:14:36'),
(903, 'Crunch Inferior Cruzado', 'Crunch Inferior Cruzado', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_903.gif', NULL, '2026-07-18 19:14:45'),
(904, 'Elevación de Cadera con piernas estiradas v2', 'Elevación de Cadera con piernas estiradas v2', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_904.gif', NULL, '2026-07-18 19:14:51'),
(905, 'Marcha Horizontal Alterna', 'Marcha Horizontal Alterna', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_905.gif', NULL, '2026-07-18 19:14:58'),
(906, 'Marcha Horizontal Alterna con palmada', 'Marcha Horizontal Alterna con palmada', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_906.gif', NULL, '2026-07-18 19:15:03'),
(907, 'Crunch Superior', 'Crunch Superior', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_907.gif', NULL, '2026-07-18 19:15:11'),
(908, 'Crunch Frog', 'Crunch Frog', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_908.gif', NULL, '2026-07-18 19:15:17'),
(909, 'Crunch Inferior sentado', 'Crunch Inferior sentado', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_909.gif', NULL, '2026-07-18 19:15:23'),
(910, 'Marcha Horizontal Aislada con pierna extendida', 'Marcha Horizontal Aislada con pierna extendida', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_910.gif', NULL, '2026-07-18 19:15:29'),
(911, 'Pulse Up', 'Pulse Up', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_911.gif', NULL, '2026-07-18 19:15:36'),
(912, 'Crunch Horizontal en Silla Romana', 'Crunch Horizontal en Silla Romana', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_912.gif', NULL, '2026-07-18 19:15:43'),
(913, 'Elevación de Piernas con torsión en soporte', 'Elevación de Piernas con torsión en soporte', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_913.gif', NULL, '2026-07-18 19:15:48'),
(914, 'Giros Superiores Sentado con peso', 'Giros Superiores Sentado con peso', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_914.gif', NULL, '2026-07-18 19:15:54'),
(915, 'Giros Superiores Sentado', 'Giros Superiores Sentado', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_915.gif', NULL, '2026-07-18 19:16:01'),
(916, 'Crunch Superior Cruzado Concentrado', 'Crunch Superior Cruzado Concentrado', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_916.gif', NULL, '2026-07-18 19:16:05'),
(917, 'Roll Reverse Crunch', 'Roll Reverse Crunch', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_917.gif', NULL, '2026-07-18 19:16:12'),
(918, 'Crunch Superior Declinado', 'Crunch Superior Declinado', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\",\"Cuádriceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_918.gif', NULL, '2026-07-18 19:16:17'),
(919, 'Puente Lateral con Abducción de Cadera', 'Puente Lateral con Abducción de Cadera', NULL, NULL, 'Abdomen', 'Abdomen', 'Oblicuos', '[\"Core/Abdomen\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_919.gif', NULL, '2026-07-18 19:16:23'),
(920, 'Crunch en Decúbito Lateral con curl de bíceps', 'Crunch en Decúbito Lateral con curl de bíceps', NULL, NULL, 'Abdomen', 'Abdomen', 'Oblicuos', '[\"Core/Abdomen\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_920.gif', NULL, '2026-07-18 19:16:29'),
(921, 'Crunch Superior Cruzado Concentrado Elevado', 'Crunch Superior Cruzado Concentrado Elevado', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_921.gif', NULL, '2026-07-18 19:16:35'),
(922, 'Half Wipers con piernas estiradas', 'Half Wipers con piernas estiradas', NULL, NULL, 'Abdomen', 'Abdomen', 'Oblicuos', '[\"Core/Abdomen\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_922.gif', NULL, '2026-07-18 19:16:40'),
(923, 'Half Wipers con piernas flexionadas', 'Half Wipers con piernas flexionadas', NULL, NULL, 'Abdomen', 'Abdomen', 'Oblicuos', '[\"Core/Abdomen\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_923.gif', NULL, '2026-07-18 19:16:46'),
(924, 'Hollow Hold', 'Hollow Hold', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_924.gif', NULL, '2026-07-18 19:16:51'),
(925, 'Crunch Superior Cruzado Declinado', 'Crunch Superior Cruzado Declinado', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_925.gif', NULL, '2026-07-18 19:16:56'),
(926, 'Elevación de Cadera con flexión de rodillas v2', 'Elevación de Cadera con flexión de rodillas v2', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_926.gif', NULL, '2026-07-18 19:17:01'),
(927, 'Wheel Rollout de rodillas', 'Wheel Rollout de rodillas', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_927.gif', NULL, '2026-07-18 19:17:08'),
(928, 'Wheel Rollout de pie', 'Wheel Rollout de pie', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_928.gif', NULL, '2026-07-18 19:17:13'),
(929, 'Puente Lateral', 'Puente Lateral', NULL, NULL, 'Abdomen', 'Abdomen', 'Oblicuos', '[\"Core/Abdomen\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_929.gif', NULL, '2026-07-18 19:17:19'),
(930, 'Crunch Inferior sentado en banco', 'Crunch Inferior sentado en banco', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_930.gif', NULL, '2026-07-18 19:17:23'),
(931, 'Crunch Inferior Inclinado con piernas estiradas', 'Crunch Inferior Inclinado con piernas estiradas', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_931.gif', NULL, '2026-07-18 19:17:29'),
(932, 'Crunch Inferior Cruzado Alterno', 'Crunch Inferior Cruzado Alterno', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_932.gif', NULL, '2026-07-18 19:17:33'),
(933, 'Crunch Cruzado con piernas elevadas', 'Crunch Cruzado con piernas elevadas', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_933.gif', NULL, '2026-07-18 19:17:39'),
(934, 'Crunch Lateral Inclinado', 'Crunch Lateral Inclinado', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_934.gif', NULL, '2026-07-18 19:17:46'),
(935, 'Post-Workout', 'Post-Workout', NULL, NULL, 'Todos', 'Todos', 'Full Body', '[]', 1, 'image', NULL, '/uploads/exercises/exercise_935.jpg', NULL, '2026-07-18 19:17:51'),
(936, 'Pre-Workout', 'Pre-Workout', NULL, NULL, 'Todos', 'Todos', 'Full Body', '[]', 1, 'image', NULL, '/uploads/exercises/exercise_936.jpg', NULL, '2026-07-18 19:17:55'),
(937, 'Crunch Lateral de pie con Banda', 'Crunch Lateral de pie con Banda', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_937.gif', NULL, '2026-07-18 19:17:58'),
(938, 'Crunch Doble Vertical en Máquina', 'Crunch Doble Vertical en Máquina', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_938.gif', NULL, '2026-07-18 19:18:04'),
(939, 'Sit Up en Máquina', 'Sit Up en Máquina', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_939.gif', NULL, '2026-07-18 19:18:11'),
(940, 'Crunch Inferior Horizontal en Máquina', 'Crunch Inferior Horizontal en Máquina', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_940.gif', NULL, '2026-07-18 19:18:20'),
(941, 'Crunch Superior Horizontal en Máquina', 'Crunch Superior Horizontal en Máquina', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_941.gif', NULL, '2026-07-18 19:18:26'),
(942, 'Giros Inferiores de Oblicuos en Máquina', 'Giros Inferiores de Oblicuos en Máquina', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_942.gif', NULL, '2026-07-18 19:18:32'),
(943, 'Crunch Superior Vertical Amplio en Máquina', 'Crunch Superior Vertical Amplio en Máquina', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_943.gif', NULL, '2026-07-18 19:18:37'),
(944, 'Crunch Superior Vertical en Máquina', 'Crunch Superior Vertical en Máquina', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_944.gif', NULL, '2026-07-18 19:18:42'),
(945, 'Giros Superiores de Oblicuos en Máquina', 'Giros Superiores de Oblicuos en Máquina', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_945.gif', NULL, '2026-07-18 19:18:47'),
(946, 'Puente Lateral Declinado Aislada', 'Puente Lateral Declinado Aislada', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\",\"Aductores\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_946.gif', NULL, '2026-07-18 19:18:52'),
(947, 'Puente Lateral Declinado', 'Puente Lateral Declinado', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_947.gif', NULL, '2026-07-18 19:18:57'),
(948, 'Plancha Lateral Inclinada', 'Plancha Lateral Inclinada', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_948.gif', NULL, '2026-07-18 19:19:02'),
(949, 'Crunch en Plancha Lateral', 'Crunch en Plancha Lateral', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_949.gif', NULL, '2026-07-18 19:19:06'),
(950, 'Plancha Lateral', 'Plancha Lateral', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_950.gif', NULL, '2026-07-18 19:19:11'),
(951, 'Plancha con rodillas', 'Plancha con rodillas', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_951.gif', NULL, '2026-07-18 19:19:17'),
(952, 'Front Plank', 'Plancha', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_952.gif', NULL, '2026-07-18 19:19:22'),
(953, 'Crunch Lateral en soporte', 'Crunch Lateral en soporte', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_953.gif', NULL, '2026-07-18 19:19:27'),
(954, 'Elevación de piernas flexionadas en soporte', 'Elevación de piernas flexionadas en soporte', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_954.gif', NULL, '2026-07-18 19:19:31'),
(955, 'Elevación de piernas estiradas en soporte', 'Elevación de piernas estiradas en soporte', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_955.gif', NULL, '2026-07-18 19:19:35'),
(956, 'Elevación de piernas laterales Colgado', 'Elevación de piernas laterales Colgado', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_956.gif', NULL, '2026-07-18 19:19:42'),
(957, 'Elevación de piernas estiradas Colgado', 'Elevación de piernas estiradas Colgado', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Cuádriceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_957.gif', NULL, '2026-07-18 19:19:49'),
(958, 'Giros de cintura de pie con Banda', 'Giros de cintura de pie con Banda', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_958.gif', NULL, '2026-07-18 19:19:54'),
(959, 'Elevación de piernas con Bandas', 'Elevación de piernas con Bandas', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\",\"Cuádriceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_959.gif', NULL, '2026-07-18 19:19:59'),
(960, 'Sit Up con Bandas', 'Sit Up con Bandas', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_960.gif', NULL, '2026-07-18 19:20:05'),
(961, 'Pliegue completo con Bandas', 'Pliegue completo con Bandas', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_961.gif', NULL, '2026-07-18 19:20:10'),
(962, 'Crunch Cruzado con Bandas', 'Crunch Cruzado con Bandas', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_962.gif', NULL, '2026-07-18 19:20:15'),
(963, 'Crunch Superior de pie con Bandas', 'Crunch Superior de pie con Bandas', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_963.gif', NULL, '2026-07-18 19:20:21'),
(964, 'Crunch Diagonal de pie con Bandas', 'Crunch Diagonal de pie con Bandas', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_964.gif', NULL, '2026-07-18 19:20:27'),
(965, 'Crunch Diagonal de rodillas con Bandas', 'Crunch Diagonal de rodillas con Bandas', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_965.gif', NULL, '2026-07-18 19:20:33'),
(966, 'Giros de cintura sentado con Polea', 'Giros de cintura sentado con Polea', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_966.gif', NULL, '2026-07-18 19:20:40'),
(967, 'Elevación de piernas colgado con Polea', 'Elevación de piernas colgado con Polea', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_967.gif', NULL, '2026-07-18 19:20:48'),
(968, 'Crunch Superior de rodillas con Polea', 'Crunch Superior de rodillas con Polea', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_968.gif', NULL, '2026-07-18 19:20:57'),
(969, 'Pliegue completo entre Poleas', 'Pliegue completo entre Poleas', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_969.gif', NULL, '2026-07-18 19:21:04'),
(970, 'Inclinación diagonal en Polea', 'Inclinación diagonal en Polea', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_970.gif', NULL, '2026-07-18 19:21:09'),
(971, 'Crunch Superior de pie con Polea delante', 'Crunch Superior de pie con Polea delante', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_971.gif', NULL, '2026-07-18 19:21:14'),
(972, 'Crunch Lateral de pie en Polea Alta', 'Crunch Lateral de pie en Polea Alta', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_972.gif', NULL, '2026-07-18 19:21:20'),
(973, 'Crunch Lateral con Barra', 'Crunch Lateral con Barra', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_973.gif', NULL, '2026-07-18 19:21:25'),
(974, 'Giros de cintura doblado con Barra', 'Giros de cintura doblado con Barra', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_974.gif', NULL, '2026-07-18 19:21:29'),
(975, 'Russian Twist con Mancuerna', 'Russian Twist con Mancuerna', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_975.gif', NULL, '2026-07-18 19:21:35'),
(976, 'Abdominales en V con Mancuerna', 'Abdominales en V con Mancuerna', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_976.gif', NULL, '2026-07-18 19:21:41'),
(977, 'Puente Lateral con Mancuerna', 'Puente Lateral con Mancuerna', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_977.gif', NULL, '2026-07-18 19:21:46'),
(978, 'Giros sentado en Fitball', 'Giros sentado en Fitball', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_978.gif', NULL, '2026-07-18 19:21:52'),
(979, 'Sit Up en Fitball', 'Sit Up en Fitball', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_979.gif', NULL, '2026-07-18 19:21:59'),
(980, 'Elevación de piernas en Fitball', 'Elevación de piernas en Fitball', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_980.gif', NULL, '2026-07-18 19:22:05'),
(981, 'Crunch Superior en Fitball', 'Crunch Superior en Fitball', NULL, NULL, 'Abdomen', 'Abdomen', 'Core/Abdomen', '[\"Oblicuos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_981.gif', NULL, '2026-07-18 19:22:12'),
(982, 'Peso Muerto Rígido con Mancuernas', 'Peso Muerto Rígido con Mancuernas', NULL, NULL, 'Pierna', 'Pierna', 'Glúteo', '[\"Femoral\",\"Full Body\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_982.gif', NULL, '2026-07-18 19:22:19'),
(983, 'Sentadilla a una pierna con Mancuerna', 'Sentadilla a una pierna con Mancuerna', NULL, NULL, 'Pierna', 'Pierna', 'Cuádriceps', '[\"Pierna\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_983.gif', NULL, '2026-07-18 19:22:25'),
(984, 'Sentadilla Sumo con Mancuerna', 'Sentadilla Sumo con Mancuerna', NULL, NULL, 'Pierna', 'Pierna', 'Glúteo', '[\"Gemelos\",\"Femoral\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_984.gif', NULL, '2026-07-18 19:22:31'),
(985, 'Zancada Delantera con Mancuernas', 'Zancada Delantera con Mancuernas', NULL, NULL, 'Pierna', 'Pierna', 'Cuádriceps', '[\"Cardio\",\"Full Body\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_985.gif', NULL, '2026-07-18 19:22:40'),
(986, 'Peso Muerto con Mancuernas', 'Peso Muerto con Mancuernas', NULL, NULL, 'Pierna', 'Pierna', 'Glúteo', '[\"Femoral\",\"Cardio\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_986.gif', NULL, '2026-07-18 19:22:45'),
(987, 'Zancada Lateral Cruzada con Mancuerna', 'Zancada Lateral Cruzada con Mancuerna', NULL, NULL, 'Pierna', 'Pierna', 'Cuádriceps', '[\"Cardio\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_987.gif', NULL, '2026-07-18 19:22:50'),
(988, 'Zancada Lateral con Mancuerna', 'Zancada Lateral con Mancuerna', NULL, NULL, 'Pierna', 'Pierna', 'Cuádriceps', '[\"Cardio\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_988.gif', NULL, '2026-07-18 19:22:56'),
(989, 'Hip Thrust con Mancuerna', 'Hip Thrust con Mancuerna', NULL, NULL, 'Pierna', 'Pierna', 'Glúteo', '[\"Femoral\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_989.gif', NULL, '2026-07-18 19:23:02'),
(990, 'Sentadilla Asistida con Mancuerna', 'Sentadilla Asistida con Mancuerna', NULL, NULL, 'Pierna', 'Pierna', 'Cuádriceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_990.gif', NULL, '2026-07-18 19:23:07'),
(991, 'Peso Muerto Abierto con Mancuerna', 'Peso Muerto Abierto con Mancuerna', NULL, NULL, 'Pierna', 'Pierna', 'Glúteo', '[\"Femoral\",\"Aductores\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_991.gif', NULL, '2026-07-18 19:23:13'),
(992, 'Sentadilla Abierta con Mancuerna', 'Sentadilla Abierta con Mancuerna', NULL, NULL, 'Pierna', 'Pierna', 'Cuádriceps', '[\"Glúteo\",\"Femoral\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_992.gif', NULL, '2026-07-18 19:23:19'),
(993, 'Peso Muerto Rumano con Mancuernas', 'Peso Muerto Rumano con Mancuernas', NULL, NULL, 'Pierna', 'Pierna', 'Glúteo', '[\"Femoral\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_993.gif', NULL, '2026-07-18 19:23:25'),
(994, 'Peso Muerto a una pierna con Mancuernas', 'Peso Muerto a una pierna con Mancuernas', NULL, NULL, 'Pierna', 'Pierna', 'Glúteo', '[\"Femoral\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_994.gif', NULL, '2026-07-18 19:23:30'),
(995, 'Zancadas con salto', 'Zancadas con salto', NULL, NULL, 'Pierna', 'Pierna', 'Cuádriceps', '[\"Glúteo\",\"Cardio\",\"Full Body\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_995.gif', NULL, '2026-07-18 19:23:36'),
(996, 'Sentadilla con Mancuernas', 'Sentadilla con Mancuernas', NULL, NULL, 'Pierna', 'Pierna', 'Cuádriceps', '[\"Cardio\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_996.gif', NULL, '2026-07-18 19:23:43'),
(997, 'Sentadilla en Pared con Mancuernas', 'Sentadilla en Pared con Mancuernas', NULL, NULL, 'Pierna', 'Pierna', 'Cuádriceps', '[\"Cardio\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_997.gif', NULL, '2026-07-18 19:23:48'),
(998, 'Sentadilla en zancada inclinada con Mancuernas', 'Sentadilla en zancada inclinada con Mancuernas', NULL, NULL, 'Pierna', 'Pierna', 'Cuádriceps', '[\"Cardio\",\"Femoral\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_998.gif', NULL, '2026-07-18 19:23:52'),
(999, 'Sentadilla con salto con Mancuernas', 'Sentadilla con salto con Mancuernas', NULL, NULL, 'Pierna', 'Pierna', 'Cardio', '[\"Cuádriceps\",\"Femoral\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_999.gif', NULL, '2026-07-18 19:23:59'),
(1000, 'Step Up con Barra', 'Step Up con Barra', NULL, NULL, 'Pierna', 'Pierna', 'Cuádriceps', '[\"Glúteo\",\"Femoral\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1000.gif', NULL, '2026-07-18 19:24:04'),
(1001, 'Zancada Lateral Cruzada con Barra', 'Zancada Lateral Cruzada con Barra', NULL, NULL, 'Pierna', 'Pierna', 'Cuádriceps', '[\"Glúteo\",\"Aductores\",\"Femoral\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1001.gif', NULL, '2026-07-18 19:24:11'),
(1002, 'Peso Muerto Asistido con Barra', 'Peso Muerto Asistido con Barra', NULL, NULL, 'Pierna', 'Pierna', 'Cuádriceps', '[\"Glúteo\",\"Femoral\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1002.gif', NULL, '2026-07-18 19:24:19'),
(1003, 'Hip Thrust Declinado con Barra', 'Hip Thrust Declinado con Barra', NULL, NULL, 'Pierna', 'Pierna', 'Glúteo', '[\"Femoral\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1003.gif', NULL, '2026-07-18 19:24:23'),
(1004, 'Peso Muerto Sumo con Barra', 'Peso Muerto Sumo con Barra', NULL, NULL, 'Pierna', 'Pierna', 'Glúteo', '[\"Femoral\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1004.gif', NULL, '2026-07-18 19:24:28'),
(1005, 'Peso Muerto a una pierna con Barra', 'Peso Muerto a una pierna con Barra', NULL, NULL, 'Pierna', 'Pierna', 'Glúteo', '[\"Femoral\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1005.gif', NULL, '2026-07-18 19:24:35'),
(1006, 'Cuarto de Sentadilla con Barra', 'Cuarto de Sentadilla con Barra', NULL, NULL, 'Pierna', 'Pierna', 'Cuádriceps', '[\"Femoral\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1006.gif', NULL, '2026-07-18 19:24:41'),
(1007, 'Sentadilla en zancada inclinada con Barra', 'Sentadilla en zancada inclinada con Barra', NULL, NULL, 'Pierna', 'Pierna', 'Cuádriceps', '[\"Glúteo\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1007.gif', NULL, '2026-07-18 19:24:46'),
(1008, 'Zancada Lateral con Barra', 'Zancada Lateral con Barra', NULL, NULL, 'Pierna', 'Pierna', 'Cuádriceps', '[\"Full Body\",\"Femoral\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1008.gif', NULL, '2026-07-18 19:24:51'),
(1009, 'Sentadilla con salto con Barra', 'Sentadilla con salto con Barra', NULL, NULL, 'Pierna', 'Pierna', 'Full Body', '[\"Cardio\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1009.gif', NULL, '2026-07-18 19:24:55'),
(1010, 'Hip Thrust Aislado con Barra', 'Hip Thrust Aislado con Barra', NULL, NULL, 'Pierna', 'Pierna', 'Glúteo', '[\"Femoral\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1010.gif', NULL, '2026-07-18 19:25:01'),
(1011, 'Extensión de Cuádriceps con Barra', 'Extensión de Cuádriceps con Barra', NULL, NULL, 'Pierna', 'Pierna', 'Cuádriceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1011.gif', NULL, '2026-07-18 19:25:07'),
(1012, 'Peso Muerto Rumano con Barra', 'Peso Muerto Rumano con Barra', NULL, NULL, 'Pierna', 'Pierna', 'Glúteo', '[\"Femoral\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1012.gif', NULL, '2026-07-18 19:25:14'),
(1013, 'Zancada Trasera con Barra', 'Zancada Trasera con Barra', NULL, NULL, 'Pierna', 'Pierna', 'Glúteo', '[\"Cuádriceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1013.gif', NULL, '2026-07-18 19:25:19'),
(1014, 'Sentadilla con Barra', 'Sentadilla con Barra', NULL, NULL, 'Pierna', 'Pierna', 'Cuádriceps', '[\"Femoral\",\"Glúteo\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1014.gif', NULL, '2026-07-18 19:25:24'),
(1015, 'Peso Muerto en Punta', 'Peso Muerto en Punta', NULL, NULL, 'Pierna', 'Pierna', 'Glúteo', '[\"Femoral\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1015.gif', NULL, '2026-07-18 19:25:30'),
(1016, 'Sentadilla en Punta', 'Sentadilla en Punta', NULL, NULL, 'Pierna', 'Pierna', 'Cuádriceps', '[\"Glúteo\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1016.gif', NULL, '2026-07-18 19:25:36'),
(1017, 'Zancada Trasera en Punta', 'Zancada Trasera en Punta', NULL, NULL, 'Pierna', 'Pierna', 'Cuádriceps', '[\"Glúteo\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1017.gif', NULL, '2026-07-18 19:25:41'),
(1018, 'Aductor Externo en Máquina', 'Aductor Externo en Máquina', NULL, NULL, 'Pierna', 'Pierna', 'Glúteo', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1018.gif', NULL, '2026-07-18 19:25:47'),
(1019, 'Curl Femoral Aislado en Máquina', 'Curl Femoral Aislado en Máquina', NULL, NULL, 'Pierna', 'Pierna', 'Femoral', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1019.gif', NULL, '2026-07-18 19:25:54'),
(1020, 'Sentadilla Sumo Inclinada en Máquina', 'Sentadilla Sumo Inclinada en Máquina', NULL, NULL, 'Pierna', 'Pierna', 'Cuádriceps', '[\"Femoral\",\"Glúteo\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1020.gif', NULL, '2026-07-18 19:25:58'),
(1021, 'Sentadilla Cerrada Inclinada en Máquina', 'Sentadilla Cerrada Inclinada en Máquina', NULL, NULL, 'Pierna', 'Pierna', 'Cuádriceps', '[\"Glúteo\",\"Femoral\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1021.gif', NULL, '2026-07-18 19:26:05'),
(1022, 'Extensión de Gemelos Inclinada en Máquina', 'Extensión de Gemelos Inclinada en Máquina', NULL, NULL, 'Pierna', 'Pierna', 'Gemelos', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1022.gif', NULL, '2026-07-18 19:26:10'),
(1023, 'Extensión de Gemelos en Prensa', 'Extensión de Gemelos en Prensa', NULL, NULL, 'Pierna', 'Pierna', 'Gemelos', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1023.gif', NULL, '2026-07-18 19:26:16'),
(1024, 'Extensión de Gemelos Concentrada en Máquina', 'Extensión de Gemelos Concentrada en Máquina', NULL, NULL, 'Pierna', 'Pierna', 'Gemelos', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1024.gif', NULL, '2026-07-18 19:26:22'),
(1025, 'Prensa Inclinada', 'Prensa Inclinada', NULL, NULL, 'Pierna', 'Pierna', 'Cuádriceps', '[\"Glúteo\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1025.gif', NULL, '2026-07-18 19:26:28'),
(1026, 'Curl Femoral Horizontal en Máquina', 'Curl Femoral Horizontal en Máquina', NULL, NULL, 'Pierna', 'Pierna', 'Femoral', '[\"Gemelos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1026.gif', NULL, '2026-07-18 19:26:33'),
(1027, 'Extensión de Gemelos en Máquina con carga Inferior', 'Extensión de Gemelos en Máquina con carga Inferior', NULL, NULL, 'Pierna', 'Pierna', 'Gemelos', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1027.gif', NULL, '2026-07-18 19:26:38'),
(1028, 'Extensión Trasera en Máquina', 'Extensión Trasera en Máquina', NULL, NULL, 'Pierna', 'Pierna', 'Glúteo', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1028.gif', NULL, '2026-07-18 19:26:44'),
(1029, 'Extensión Frontal en Máquina', 'Extensión Frontal en Máquina', NULL, NULL, 'Pierna', 'Pierna', 'Aductores', '[\"Pierna\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1029.gif', NULL, '2026-07-18 19:26:49'),
(1030, 'Aductor Interno Aislado en Máquina', 'Aductor Interno Aislado en Máquina', NULL, NULL, 'Pierna', 'Pierna', 'Aductores', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1030.gif', NULL, '2026-07-18 19:26:56'),
(1031, 'Aductor Externo Aislado en Máquina', 'Aductor Externo Aislado en Máquina', NULL, NULL, 'Pierna', 'Pierna', 'Abductores', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1031.gif', NULL, '2026-07-18 19:27:02'),
(1032, 'Extensión de Gemelos Declinada en Máquina', 'Extensión de Gemelos Declinada en Máquina', NULL, NULL, 'Pierna', 'Pierna', 'Gemelos', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1032.gif', NULL, '2026-07-18 19:27:07'),
(1033, 'Extensión de Gemelos en Máquina con carga Superior', 'Extensión de Gemelos en Máquina con carga Superior', NULL, NULL, 'Pierna', 'Pierna', 'Gemelos', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1033.gif', NULL, '2026-07-18 19:27:14'),
(1034, 'Aductor Interno en Máquina', 'Aductor Interno en Máquina', NULL, NULL, 'Pierna', 'Pierna', 'Aductores', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1034.gif', NULL, '2026-07-18 19:27:19'),
(1035, 'Extensión de Cuádriceps en Máquina', 'Extensión de Cuádriceps en Máquina', NULL, NULL, 'Pierna', 'Pierna', 'Cuádriceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1035.gif', NULL, '2026-07-18 19:27:24'),
(1036, 'Sentadilla en Máquina', 'Sentadilla en Máquina', NULL, NULL, 'Pierna', 'Pierna', 'Cuádriceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1036.gif', NULL, '2026-07-18 19:27:30'),
(1037, 'Remo en Supinación en Máquina Smith', 'Remo en Supinación en Máquina Smith', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1037.gif', NULL, '2026-07-18 19:27:36'),
(1038, 'Remo Aislado en Pronación en Máquina Smith', 'Remo Aislado en Pronación en Máquina Smith', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1038.gif', NULL, '2026-07-18 19:27:42'),
(1039, 'Hiperextensiones en Máquina', 'Hiperextensiones en Máquina', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1039.gif', NULL, '2026-07-18 19:27:48'),
(1040, 'Curl Femoral Libre', 'Curl Femoral Libre', NULL, NULL, 'Pierna', 'Pierna', 'Femoral', '[\"Gemelos\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1040.gif', NULL, '2026-07-18 19:27:53'),
(1041, 'Step Up Lateral', 'Step Up Lateral', NULL, NULL, 'Pierna', 'Pierna', 'Cardio', '[\"Pierna\",\"Cuádriceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1041.gif', NULL, '2026-07-18 19:27:58'),
(1042, 'Extensión de Gemelos sentado con Mancuerna', 'Extensión de Gemelos sentado con Mancuerna', NULL, NULL, 'Pierna', 'Pierna', 'Gemelos', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1042.gif', NULL, '2026-07-18 19:28:04'),
(1043, 'Sentadilla a una pierna con Banda Delante', 'Sentadilla a una pierna con Banda Delante', NULL, NULL, 'Pierna', 'Pierna', 'Glúteo', '[\"Cuádriceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1043.gif', NULL, '2026-07-18 19:28:11'),
(1044, 'Peso Muerto con Bandas', 'Peso Muerto con Bandas', NULL, NULL, 'Pierna', 'Pierna', 'Glúteo', '[\"Femoral\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1044.gif', NULL, '2026-07-18 19:28:17'),
(1045, 'Rotación de Cadera Interna con Banda', 'Rotación de Cadera Interna con Banda', NULL, NULL, 'Pierna', 'Pierna', 'Pierna', '[\"Cardio\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_1045.gif', NULL, '2026-07-18 19:28:22'),
(1046, 'Rotación de Cadera Externa con Banda', 'Rotación de Cadera Externa con Banda', NULL, NULL, 'Pierna', 'Pierna', 'Pierna', '[\"Cardio\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_1046.gif', NULL, '2026-07-18 19:28:27'),
(1047, 'Extensión de Gemelo Aislado con Banda', 'Extensión de Gemelo Aislado con Banda', NULL, NULL, 'Pierna', 'Pierna', 'Gemelos', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1047.gif', NULL, '2026-07-18 19:28:33'),
(1048, 'Extensión de Gemelo Aislado Delantero con Banda', 'Extensión de Gemelo Aislado Delantero con Banda', NULL, NULL, 'Pierna', 'Pierna', 'Gemelos', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1048.gif', NULL, '2026-07-18 19:28:38'),
(1049, 'Sentadilla a una pierna con Banda Debajo', 'Sentadilla a una pierna con Banda Debajo', NULL, NULL, 'Pierna', 'Pierna', 'Glúteo', '[\"Cuádriceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1049.gif', NULL, '2026-07-18 19:28:44'),
(1050, 'Sentadilla con Banda', 'Sentadilla con Banda', NULL, NULL, 'Pierna', 'Pierna', 'Glúteo', '[\"Cuádriceps\",\"Femoral\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_1050.gif', NULL, '2026-07-18 19:28:51'),
(1051, 'Step Up con Banda', 'Step Up con Banda', NULL, NULL, 'Pierna', 'Pierna', 'Glúteo', '[\"Cuádriceps\",\"Femoral\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_1051.gif', NULL, '2026-07-18 19:28:58'),
(1052, 'Peso Muerto con Banda', 'Peso Muerto con Banda', NULL, NULL, 'Pierna', 'Pierna', 'Glúteo', '[\"Femoral\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1052.gif', NULL, '2026-07-18 19:29:02'),
(1053, 'Rotación de Aductor Interna con Banda', 'Rotación de Aductor Interna con Banda', NULL, NULL, 'Pierna', 'Pierna', 'Aductores', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1053.gif', NULL, '2026-07-18 19:29:09'),
(1054, 'Rotación de Aductor Externa con Banda', 'Rotación de Aductor Externa con Banda', NULL, NULL, 'Pierna', 'Pierna', 'Aductores', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1054.gif', NULL, '2026-07-18 19:29:15'),
(1055, 'Extensión de Gemelos con Banda', 'Extensión de Gemelos con Banda', NULL, NULL, 'Pierna', 'Pierna', 'Gemelos', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1055.gif', NULL, '2026-07-18 19:29:21'),
(1056, 'Extensión de Cuádriceps Aislada con Banda', 'Extensión de Cuádriceps Aislada con Banda', NULL, NULL, 'Pierna', 'Pierna', 'Cuádriceps', '[]', 1, 'gif', NULL, '/uploads/exercises/exercise_1056.gif', NULL, '2026-07-18 19:29:26'),
(1057, 'Sentadilla Aislada Asistida con Cuerda', 'Sentadilla Aislada Asistida con Cuerda', NULL, NULL, 'Pierna', 'Pierna', 'Cuádriceps', '[\"Glúteo\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1057.gif', NULL, '2026-07-18 19:29:32'),
(1058, 'Extensión Trasera Aislada en Polea Baja', 'Extensión Trasera Aislada en Polea Baja', NULL, NULL, 'Pierna', 'Pierna', 'Glúteo', '[\"Femoral\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1058.gif', NULL, '2026-07-18 19:29:38'),
(1059, 'Peso Muerto en Polea', 'Peso Muerto en Polea', NULL, NULL, 'Pierna', 'Pierna', 'Glúteo', '[\"Femoral\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1059.gif', NULL, '2026-07-18 19:29:43'),
(1060, 'Extensión de Gemelo Aislado en Polea', 'Extensión de Gemelo Aislado en Polea', NULL, NULL, 'Pierna', 'Pierna', 'Gemelos', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1060.gif', NULL, '2026-07-18 19:29:49'),
(1061, 'Extensión de Gemelos en Polea', 'Extensión de Gemelos en Polea', NULL, NULL, 'Pierna', 'Pierna', 'Gemelos', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1061.gif', NULL, '2026-07-18 19:29:54'),
(1062, 'Aductor Externo en Polea', 'Aductor Externo en Polea', NULL, NULL, 'Pierna', 'Pierna', 'Abductores', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1062.gif', NULL, '2026-07-18 19:30:01'),
(1063, 'Curl Femoral Libre Asistido con Polea', 'Curl Femoral Libre Asistido con Polea', NULL, NULL, 'Pierna', 'Pierna', 'Femoral', '[\"Cuádriceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1063.gif', NULL, '2026-07-18 19:30:07'),
(1064, 'Zancada Delantera en Polea', 'Zancada Delantera en Polea', NULL, NULL, 'Pierna', 'Pierna', 'Glúteo', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1064.gif', NULL, '2026-07-18 19:30:11'),
(1065, 'Zancada Lateral en Polea', 'Zancada Lateral en Polea', NULL, NULL, 'Pierna', 'Pierna', 'Cuádriceps', '[\"Glúteo\",\"Femoral\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1065.gif', NULL, '2026-07-18 19:30:17'),
(1066, 'Extensión de Glúteos en Polea', 'Extensión de Glúteos en Polea', NULL, NULL, 'Pierna', 'Pierna', 'Glúteo', '[\"Femoral\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1066.gif', NULL, '2026-07-18 19:30:22'),
(1067, 'Zancada Trasera en Polea', 'Zancada Trasera en Polea', NULL, NULL, 'Pierna', 'Pierna', 'Cuádriceps', '[\"Glúteo\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1067.gif', NULL, '2026-07-18 19:30:27'),
(1068, 'Sentadilla con Poleas', 'Sentadilla con Poleas', NULL, NULL, 'Pierna', 'Pierna', 'Cuádriceps', '[\"Glúteo\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1068.gif', NULL, '2026-07-18 19:30:32'),
(1069, 'Remo Declinado en Pronación en Polea', 'Remo Declinado en Pronación en Polea', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1069.gif', NULL, '2026-07-18 19:30:37'),
(1070, 'Remo Declinado Neutro en Pronación en Polea', 'Remo Declinado Neutro en Pronación en Polea', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\",\"Trapecio\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1070.gif', NULL, '2026-07-18 19:30:41'),
(1071, 'Remo Horizontal Cerrado Neutro Amplio en Polea', 'Remo Horizontal Cerrado Neutro Amplio en Polea', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1071.gif', NULL, '2026-07-18 19:30:47'),
(1072, 'Serratos con giro en Polea', 'Serratos con giro en Polea', NULL, NULL, 'Espalda', 'Espalda', 'Dorsal', '[\"Espalda\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1072.gif', NULL, '2026-07-18 19:30:53'),
(1073, 'Jalón Cerrado Neutro en Polea Alta', 'Jalón Cerrado Neutro en Polea Alta', NULL, NULL, 'Espalda', 'Espalda', 'Dorsal', '[\"Espalda\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1073.gif', NULL, '2026-07-18 19:31:01'),
(1074, 'Remo Horizontal Cerrado Neutro en Polea', 'Remo Horizontal Cerrado Neutro en Polea', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1074.gif', NULL, '2026-07-18 19:31:07'),
(1075, 'Remo Inferior Aislado en Polea Baja', 'Remo Inferior Aislado en Polea Baja', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1075.gif', NULL, '2026-07-18 19:31:13'),
(1076, 'Serratos Aislados en Polea', 'Serratos Aislados en Polea', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\",\"Tríceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1076.gif', NULL, '2026-07-18 19:31:19'),
(1077, 'Remo Superior en Pronación en Polea', 'Remo Superior en Pronación en Polea', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Hombros\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1077.gif', NULL, '2026-07-18 19:31:24'),
(1078, 'Jalón Abierto Doble Neutro en Polea Alta', 'Jalón Abierto Doble Neutro en Polea Alta', NULL, NULL, 'Espalda', 'Espalda', 'Dorsal', '[\"Espalda\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1078.gif', NULL, '2026-07-18 19:31:32'),
(1079, 'Remo Inferior en Pronación en Polea Baja', 'Remo Inferior en Pronación en Polea Baja', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1079.gif', NULL, '2026-07-18 19:31:38');
INSERT INTO `exercises` (`id`, `name`, `name_es`, `description`, `description_es`, `target_muscle`, `target_muscle_es`, `primary_muscle`, `secondary_muscles`, `is_warmup`, `media_type`, `media_url`, `local_media_path`, `created_by_trainer_id`, `created_at`) VALUES
(1080, 'Serratos Inclinados con Barra en Polea', 'Serratos Inclinados con Barra en Polea', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\",\"Pecho\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1080.gif', NULL, '2026-07-18 19:31:44'),
(1081, 'Rotación Vertical Aislada en Polea', 'Rotación Vertical Aislada en Polea', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Hombros\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1081.gif', NULL, '2026-07-18 19:31:50'),
(1082, 'Jalón Abierto Neutro en Polea Alta', 'Jalón Abierto Neutro en Polea Alta', NULL, NULL, 'Espalda', 'Espalda', 'Dorsal', '[\"Espalda\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1082.gif', NULL, '2026-07-18 19:31:55'),
(1083, 'Remo Cruzado en Polea Alta', 'Remo Cruzado en Polea Alta', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1083.gif', NULL, '2026-07-18 19:32:01'),
(1084, 'Remo Declinado Abierto en Pronación en Polea', 'Remo Declinado Abierto en Pronación en Polea', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Hombros\",\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1084.gif', NULL, '2026-07-18 19:32:05'),
(1085, 'Remo Superior con Cuerda en Polea', 'Remo Superior con Cuerda en Polea', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\",\"Hombros\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1085.gif', NULL, '2026-07-18 19:32:12'),
(1086, 'Jalón Cerrado con Cuerda en Polea Alta', 'Jalón Cerrado con Cuerda en Polea Alta', NULL, NULL, 'Espalda', 'Espalda', 'Dorsal', '[\"Espalda\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1086.gif', NULL, '2026-07-18 19:32:17'),
(1087, 'Remo Horizontal en Pronación en Polea', 'Remo Horizontal en Pronación en Polea', NULL, NULL, 'Espalda', 'Espalda', 'Dorsal', '[\"Espalda\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1087.gif', NULL, '2026-07-18 19:32:23'),
(1088, 'Jalón Aislado Prono-Supino en Polea Alta', 'Jalón Aislado Prono-Supino en Polea Alta', NULL, NULL, 'Espalda', 'Espalda', 'Dorsal', '[\"Espalda\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1088.gif', NULL, '2026-07-18 19:32:30'),
(1089, 'Jalón Abierto en Pronación en Polea Alta', 'Jalón Abierto en Pronación en Polea Alta', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1089.gif', NULL, '2026-07-18 19:32:38'),
(1090, 'Jalón en Pronación en Polea Alta', 'Jalón en Pronación en Polea Alta', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1090.gif', NULL, '2026-07-18 19:32:46'),
(1091, 'Remo Horizontal Superior con Cuerda en Polea', 'Remo Horizontal Superior con Cuerda en Polea', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Hombros\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1091.gif', NULL, '2026-07-18 19:32:51'),
(1092, 'Jalón Trasero Abierto en Pronación en Polea Alta', 'Jalón Trasero Abierto en Pronación en Polea Alta', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1092.gif', NULL, '2026-07-18 19:32:57'),
(1093, 'Jalón en Supinación en Polea Alta', 'Jalón en Supinación en Polea Alta', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1093.gif', NULL, '2026-07-18 19:33:01'),
(1094, 'Jalón Cerrado Neutro con Inclinación en Polea Alta', 'Jalón Cerrado Neutro con Inclinación en Polea Alta', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1094.gif', NULL, '2026-07-18 19:33:06'),
(1095, 'Jalón Abierto en Supinación en Polea Alta', 'Jalón Abierto en Supinación en Polea Alta', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1095.gif', NULL, '2026-07-18 19:33:11'),
(1096, 'Serratos con Cuerda en Polea', 'Serratos con Cuerda en Polea', NULL, NULL, 'Espalda', 'Espalda', 'Dorsal', '[\"Espalda\",\"Tríceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1096.gif', NULL, '2026-07-18 19:33:17'),
(1097, 'Remo Horizontal Neutro en Polea', 'Remo Horizontal Neutro en Polea', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1097.gif', NULL, '2026-07-18 19:33:21'),
(1098, 'Remo Horizontal Abierto en Pronación en Polea', 'Remo Horizontal Abierto en Pronación en Polea', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1098.gif', NULL, '2026-07-18 19:33:30'),
(1099, 'Remo con giro Aislado en Polea Baja', 'Remo con giro Aislado en Polea Baja', NULL, NULL, 'Espalda', 'Espalda', 'Dorsal', '[\"Espalda\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1099.gif', NULL, '2026-07-18 19:33:36'),
(1100, 'Remo Horizontal Aislado en Polea', 'Remo Horizontal Aislado en Polea', NULL, NULL, 'Espalda', 'Espalda', 'Dorsal', '[\"Espalda\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1100.gif', NULL, '2026-07-18 19:33:42'),
(1101, 'Remo Superior Aislado en Polea', 'Remo Superior Aislado en Polea', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1101.gif', NULL, '2026-07-18 19:33:48'),
(1102, 'Remo Horizontal Cerrado en Pronación en Polea', 'Remo Horizontal Cerrado en Pronación en Polea', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1102.gif', NULL, '2026-07-18 19:33:55'),
(1103, 'Jalón Aislado en Polea Alta', 'Jalón Aislado en Polea Alta', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1103.gif', NULL, '2026-07-18 19:34:01'),
(1104, 'Remo Inferior Aislado con Banda', 'Remo Inferior Aislado con Banda', NULL, NULL, 'Espalda', 'Espalda', 'Dorsal', '[\"Espalda\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1104.gif', NULL, '2026-07-18 19:34:07'),
(1105, 'Remo Superior Aislado con Banda', 'Remo Superior Aislado con Banda', NULL, NULL, 'Espalda', 'Espalda', 'Dorsal', '[\"Espalda\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1105.gif', NULL, '2026-07-18 19:34:12'),
(1106, 'Remo Horizontal Aislado con Banda', 'Remo Horizontal Aislado con Banda', NULL, NULL, 'Espalda', 'Espalda', 'Dorsal', '[\"Espalda\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1106.gif', NULL, '2026-07-18 19:34:17'),
(1107, 'Jalón en Supinación con Bandas', 'Jalón en Supinación con Bandas', NULL, NULL, 'Espalda', 'Espalda', 'Dorsal', '[\"Espalda\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1107.gif', NULL, '2026-07-18 19:34:24'),
(1108, 'Jalón Neutro con Bandas', 'Jalón Neutro con Bandas', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1108.gif', NULL, '2026-07-18 19:34:30'),
(1109, 'Remo Declinado Alterno con Bandas', 'Remo Declinado Alterno con Bandas', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1109.gif', NULL, '2026-07-18 19:34:35'),
(1110, 'Remo Horizontal con Bandas', 'Remo Horizontal con Bandas', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_1110.gif', NULL, '2026-07-18 19:34:41'),
(1111, 'Remo Libre Declinado con Cuerdas', 'Remo Libre Declinado con Cuerdas', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1111.gif', NULL, '2026-07-18 19:34:47'),
(1112, 'Remo Inclinado Alterno con Bandas', 'Remo Inclinado Alterno con Bandas', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1112.gif', NULL, '2026-07-18 19:34:52'),
(1113, 'Remo Libre Inclinado Abierto con Cuerda', 'Remo Libre Inclinado Abierto con Cuerda', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1113.gif', NULL, '2026-07-18 19:34:58'),
(1114, 'Remo Libre Inclinado Cerrado con Cuerda', 'Remo Libre Inclinado Cerrado con Cuerda', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\",\"Hombros\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1114.gif', NULL, '2026-07-18 19:35:04'),
(1115, 'Remo Libre Horizontal Cerrado con Cuerda', 'Remo Libre Horizontal Cerrado con Cuerda', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\",\"Braquial\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1115.gif', NULL, '2026-07-18 19:35:09'),
(1116, 'Elevación Frontal Aislada en Polea', 'Elevación Frontal Aislada en Polea', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1116.gif', NULL, '2026-07-18 19:35:15'),
(1117, 'Elevación Lateral Aislada en Polea', 'Elevación Lateral Aislada en Polea', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[]', 1, 'gif', NULL, '/uploads/exercises/exercise_1117.gif', NULL, '2026-07-18 19:35:23'),
(1118, 'Encogimientos en Polea', 'Encogimientos en Polea', NULL, NULL, 'Hombro', 'Hombro', 'Trapecio', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1118.gif', NULL, '2026-07-18 19:35:29'),
(1119, 'Rotación Externa Aislada en Polea', 'Rotación Externa Aislada en Polea', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[]', 1, 'gif', NULL, '/uploads/exercises/exercise_1119.gif', NULL, '2026-07-18 19:35:34'),
(1120, 'Rotación Interna Aislada en Polea', 'Rotación Interna Aislada en Polea', NULL, NULL, 'Hombro', 'Hombro', 'Pecho', '[]', 1, 'gif', NULL, '/uploads/exercises/exercise_1120.gif', NULL, '2026-07-18 19:35:39'),
(1121, 'Elevación Lateral Horizontal en Polea', 'Elevación Lateral Horizontal en Polea', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1121.gif', NULL, '2026-07-18 19:35:45'),
(1122, 'Remo Superior en Polea', 'Remo Superior en Polea', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[\"Espalda\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1122.gif', NULL, '2026-07-18 19:35:51'),
(1123, 'Elevación Lateral Concentrada en Polea', 'Elevación Lateral Concentrada en Polea', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1123.gif', NULL, '2026-07-18 19:35:56'),
(1124, 'Pájaros Aislados en Polea', 'Pájaros Aislados en Polea', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[\"Trapecio\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1124.gif', NULL, '2026-07-18 19:36:02'),
(1125, 'Press Militar Cerrado en Polea', 'Press Militar Cerrado en Polea', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[\"Tríceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1125.gif', NULL, '2026-07-18 19:36:16'),
(1126, 'Elevación Frontal Inclinada en Polea', 'Elevación Frontal Inclinada en Polea', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1126.gif', NULL, '2026-07-18 19:36:31'),
(1127, 'Remo al mentón Horizontal en Polea', 'Remo al mentón Horizontal en Polea', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1127.gif', NULL, '2026-07-18 19:36:40'),
(1128, 'Encogimientos Horizontales en Polea', 'Encogimientos Horizontales en Polea', NULL, NULL, 'Hombro', 'Hombro', 'Trapecio', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1128.gif', NULL, '2026-07-18 19:36:46'),
(1129, 'Elevación Frontal Horizontal en Polea', 'Elevación Frontal Horizontal en Polea', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1129.gif', NULL, '2026-07-18 19:36:52'),
(1130, 'Press Militar con Bandas', 'Press Militar con Bandas', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[\"Tríceps\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_1130.gif', NULL, '2026-07-18 19:36:59'),
(1131, 'Extensiones Laterales Amplias con Banda', 'Extensiones Laterales Amplias con Banda', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[]', 1, 'gif', NULL, '/uploads/exercises/exercise_1131.gif', NULL, '2026-07-18 19:37:05'),
(1132, 'Elevaciones Completas con Bandas', 'Elevaciones Completas con Bandas', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[]', 1, 'gif', NULL, '/uploads/exercises/exercise_1132.gif', NULL, '2026-07-18 19:37:10'),
(1133, 'Encogimientos con Banda', 'Encogimientos con Banda', NULL, NULL, 'Hombro', 'Hombro', 'Trapecio', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1133.gif', NULL, '2026-07-18 19:37:16'),
(1134, 'Remo Superior con Bandas', 'Remo Superior con Bandas', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[\"Trapecio\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1134.gif', NULL, '2026-07-18 19:37:21'),
(1135, 'Elevaciones Laterales con Banda', 'Elevaciones Laterales con Banda', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[]', 1, 'gif', NULL, '/uploads/exercises/exercise_1135.gif', NULL, '2026-07-18 19:37:26'),
(1136, 'Remo al mentón con Banda', 'Remo al mentón con Banda', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[]', 1, 'gif', NULL, '/uploads/exercises/exercise_1136.gif', NULL, '2026-07-18 19:37:31'),
(1137, 'Elevaciones Frontales con Banda', 'Elevaciones Frontales con Banda', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[]', 1, 'gif', NULL, '/uploads/exercises/exercise_1137.gif', NULL, '2026-07-18 19:37:36'),
(1138, 'Press Militar Trasero con Bandas', 'Press Militar Trasero con Bandas', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[]', 1, 'gif', NULL, '/uploads/exercises/exercise_1138.gif', NULL, '2026-07-18 19:37:43'),
(1139, 'Press Militar Aislado con Banda', 'Press Militar Aislado con Banda', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[]', 1, 'gif', NULL, '/uploads/exercises/exercise_1139.gif', NULL, '2026-07-18 19:37:47'),
(1140, 'Pájaros de pie con Bandas', 'Pájaros de pie con Bandas', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[\"Espalda\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1140.gif', NULL, '2026-07-18 19:37:53'),
(1141, 'Elevación Lateral Aislada con Banda', 'Elevación Lateral Aislada con Banda', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[]', 1, 'gif', NULL, '/uploads/exercises/exercise_1141.gif', NULL, '2026-07-18 19:37:57'),
(1142, 'Encogimientos en Paralelas', 'Encogimientos en Paralelas', NULL, NULL, 'Hombro', 'Hombro', 'Trapecio', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1142.gif', NULL, '2026-07-18 19:38:02'),
(1143, 'Encogimientos Libres en Banco', 'Encogimientos Libres en Banco', NULL, NULL, 'Hombro', 'Hombro', 'Trapecio', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1143.gif', NULL, '2026-07-18 19:38:06'),
(1144, 'Flexiones Verticales entre Bancos', 'Flexiones Verticales entre Bancos', NULL, NULL, 'Hombro', 'Hombro', 'Tríceps', '[\"Espalda\",\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1144.gif', NULL, '2026-07-18 19:38:14'),
(1145, 'Flexiones Verticales con Banco', 'Flexiones Verticales con Banco', NULL, NULL, 'Hombro', 'Hombro', 'Tríceps', '[\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1145.gif', NULL, '2026-07-18 19:38:20'),
(1146, 'Press Militar Libre entre Bancos', 'Press Militar Libre entre Bancos', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[\"Tríceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1146.gif', NULL, '2026-07-18 19:38:27'),
(1147, 'Press Militar Declinado en Pronación en Máquina', 'Press Militar Declinado en Pronación en Máquina', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[\"Tríceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1147.gif', NULL, '2026-07-18 19:38:33'),
(1148, 'Aperturas Traseras Neutras en Máquina', 'Aperturas Traseras Neutras en Máquina', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[\"Espalda\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1148.gif', NULL, '2026-07-18 19:38:40'),
(1149, 'Aperturas Traseras en Pronación en Máquina', 'Aperturas Traseras en Pronación en Máquina', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1149.gif', NULL, '2026-07-18 19:38:46'),
(1150, 'Press Aislado en Punta', 'Press Aislado en Punta', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[\"Tríceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1150.gif', NULL, '2026-07-18 19:38:53'),
(1151, 'Press Militar Inclinado en Pronación en Máquina', 'Press Militar Inclinado en Pronación en Máquina', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[\"Tríceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1151.gif', NULL, '2026-07-18 19:38:58'),
(1152, 'Encogimientos en Máquina', 'Encogimientos en Máquina', NULL, NULL, 'Hombro', 'Hombro', 'Trapecio', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1152.gif', NULL, '2026-07-18 19:39:04'),
(1153, 'Encogimientos Concentrados en Máquina', 'Encogimientos Concentrados en Máquina', NULL, NULL, 'Hombro', 'Hombro', 'Trapecio', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1153.gif', NULL, '2026-07-18 19:39:10'),
(1154, 'Press Militar Inclinado Neutro en Máquina', 'Press Militar Inclinado Neutro en Máquina', NULL, NULL, 'Hombro', 'Hombro', 'Pecho', '[\"Tríceps\",\"Hombros\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1154.gif', NULL, '2026-07-18 19:39:17'),
(1155, 'Press Militar en Pronación en Máquina', 'Press Militar en Pronación en Máquina', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[\"Tríceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1155.gif', NULL, '2026-07-18 19:39:24'),
(1156, 'Press Militar Neutro en Máquina', 'Press Militar Neutro en Máquina', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[\"Tríceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1156.gif', NULL, '2026-07-18 19:39:30'),
(1157, 'Elevación Lateral en Punta', 'Elevación Lateral en Punta', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1157.gif', NULL, '2026-07-18 19:39:35'),
(1158, 'Elevaciones Laterales en Máquina', 'Elevaciones Laterales en Máquina', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1158.gif', NULL, '2026-07-18 19:39:41'),
(1159, 'Encogimientos Declinados con Mancuernas', 'Encogimientos Declinados con Mancuernas', NULL, NULL, 'Hombro', 'Hombro', 'Trapecio', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1159.gif', NULL, '2026-07-18 19:39:47'),
(1160, 'Elevaciones Laterales en Supinación con Mancuernas', 'Elevaciones Laterales en Supinación con Mancuernas', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1160.gif', NULL, '2026-07-18 19:39:52'),
(1161, 'Encogimientos Inclinados con Mancuernas', 'Encogimientos Inclinados con Mancuernas', NULL, NULL, 'Hombro', 'Hombro', 'Trapecio', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1161.gif', NULL, '2026-07-18 19:39:58'),
(1162, 'Elevación Lateral Horizontal Aislada con Mancuerna', 'Elevación Lateral Horizontal Aislada con Mancuerna', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[\"Espalda\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1162.gif', NULL, '2026-07-18 19:40:03'),
(1163, 'Elevaciones Completas con Mancuernas', 'Elevaciones Completas con Mancuernas', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[]', 1, 'gif', NULL, '/uploads/exercises/exercise_1163.gif', NULL, '2026-07-18 19:40:09'),
(1164, 'Press Militar con giro con Mancuernas', 'Press Militar con giro con Mancuernas', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[\"Cardio\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1164.gif', NULL, '2026-07-18 19:40:14'),
(1165, 'Rotación Vertical Aislada con Mancuerna', 'Rotación Vertical Aislada con Mancuerna', NULL, NULL, 'Hombro', 'Hombro', 'Cardio', '[]', 1, 'gif', NULL, '/uploads/exercises/exercise_1165.gif', NULL, '2026-07-18 19:40:19'),
(1166, 'Elevaciones Frontales Inclinadas en Pronación con Mancuernas', 'Elevaciones Frontales Inclinadas en Pronación con Mancuernas', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1166.gif', NULL, '2026-07-18 19:40:26'),
(1167, 'Elevaciones Laterales Declinadas con Mancuernas', 'Elevaciones Laterales Declinadas con Mancuernas', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[\"Espalda\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1167.gif', NULL, '2026-07-18 19:40:31'),
(1168, 'Remo Superior Aislado con Mancuerna', 'Remo Superior Aislado con Mancuerna', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[\"Espalda\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1168.gif', NULL, '2026-07-18 19:40:40'),
(1169, 'Pájaros sentado con Mancuernas', 'Pájaros sentado con Mancuernas', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1169.gif', NULL, '2026-07-18 19:40:45'),
(1170, 'Elevaciones Laterales Declinadas en Pronación con Mancuernas', 'Elevaciones Laterales Declinadas en Pronación con Mancuernas', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1170.gif', NULL, '2026-07-18 19:40:52'),
(1171, 'Elevaciones Laterales Declinadas Neutras con Mancuernas', 'Elevaciones Laterales Declinadas Neutras con Mancuernas', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1171.gif', NULL, '2026-07-18 19:41:00'),
(1172, 'Elevaciones Laterales Horizontales con Mancuernas', 'Elevaciones Laterales Horizontales con Mancuernas', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1172.gif', NULL, '2026-07-18 19:41:07'),
(1173, 'Rotación Externa Aislada con Mancuerna', 'Rotación Externa Aislada con Mancuerna', NULL, NULL, 'Hombro', 'Hombro', 'Cardio', '[]', 1, 'gif', NULL, '/uploads/exercises/exercise_1173.gif', NULL, '2026-07-18 19:41:12'),
(1174, 'Press Cubano Circular con Mancuernas', 'Press Cubano Circular con Mancuernas', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[\"Cardio\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_1174.gif', NULL, '2026-07-18 19:41:17'),
(1175, 'Elevaciones Lateral - Frontal con Mancuernas', 'Elevaciones Lateral - Frontal con Mancuernas', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[\"Cardio\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_1175.gif', NULL, '2026-07-18 19:41:24'),
(1176, 'Press Arnold con Mancuernas', 'Press Arnold con Mancuernas', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[\"Tríceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1176.gif', NULL, '2026-07-18 19:41:30'),
(1177, 'Elevaciones Circulares con Mancuernas', 'Elevaciones Circulares con Mancuernas', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[\"Cardio\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_1177.gif', NULL, '2026-07-18 19:41:35'),
(1178, 'Press Scott con Mancuernas', 'Press Scott con Mancuernas', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[\"Cardio\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_1178.gif', NULL, '2026-07-18 19:41:40'),
(1179, 'Elevaciones Laterales Delanteras con Mancuernas', 'Elevaciones Laterales Delanteras con Mancuernas', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1179.gif', NULL, '2026-07-18 19:41:45'),
(1180, 'Press Horizontal con Mancuernas', 'Press Horizontal con Mancuernas', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[\"Espalda\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1180.gif', NULL, '2026-07-18 19:41:50'),
(1181, 'Remo Superior Trasero con Mancuernas', 'Remo Superior Trasero con Mancuernas', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1181.gif', NULL, '2026-07-18 19:41:55'),
(1182, 'Elevaciones Laterales Declinadas en Supinación con Mancuernas', 'Elevaciones Laterales Declinadas en Supinación con Mancuernas', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[\"Espalda\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1182.gif', NULL, '2026-07-18 19:42:00'),
(1183, 'Elevaciones Lateral - Frontal Alto con Mancuernas', 'Elevaciones Lateral - Frontal Alto con Mancuernas', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1183.gif', NULL, '2026-07-18 19:42:06'),
(1184, 'Rotación Externa Concentrada con Mancuerna', 'Rotación Externa Concentrada con Mancuerna', NULL, NULL, 'Hombro', 'Hombro', 'Cardio', '[]', 1, 'gif', NULL, '/uploads/exercises/exercise_1184.gif', NULL, '2026-07-18 19:42:12'),
(1185, 'Elevaciones Frontales en Supinación con Mancuernas', 'Elevaciones Frontales en Supinación con Mancuernas', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[\"Bíceps\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_1185.gif', NULL, '2026-07-18 19:42:17'),
(1186, 'Elevación Frontal Declinada con Mancuerna', 'Elevación Frontal Declinada con Mancuerna', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[\"Pecho\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1186.gif', NULL, '2026-07-18 19:42:23'),
(1187, 'Encogimiento Aislado con Mancuerna', 'Encogimiento Aislado con Mancuerna', NULL, NULL, 'Hombro', 'Hombro', 'Trapecio', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1187.gif', NULL, '2026-07-18 19:42:27'),
(1188, 'Elevaciones Frontales Declinadas Neutras con Mancuernas', 'Elevaciones Frontales Declinadas Neutras con Mancuernas', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1188.gif', NULL, '2026-07-18 19:42:33'),
(1189, 'Elevaciones Laterales Neutras con Mancuernas', 'Elevaciones Laterales Neutras con Mancuernas', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1189.gif', NULL, '2026-07-18 19:42:39'),
(1190, 'Elevaciones Frontales Declinadas en Pronación con Mancuernas', 'Elevaciones Frontales Declinadas en Pronación con Mancuernas', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[\"Espalda\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1190.gif', NULL, '2026-07-18 19:42:44'),
(1191, 'Elevación Trasera con Barra', 'Elevación Trasera con Barra', NULL, NULL, 'Hombro', 'Hombro', 'Trapecio', '[\"Antebrazo\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1191.gif', NULL, '2026-07-18 19:42:51'),
(1192, 'Extensión Trasera con Barra', 'Extensión Trasera con Barra', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[]', 1, 'gif', NULL, '/uploads/exercises/exercise_1192.gif', NULL, '2026-07-18 19:42:58'),
(1193, 'Press Militar en Supinación con Barra Z', 'Press Militar en Supinación con Barra Z', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[\"Tríceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1193.gif', NULL, '2026-07-18 19:43:06'),
(1194, 'Elevación Frontal Cerrada en Pronación con Barra', 'Elevación Frontal Cerrada en Pronación con Barra', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[\"Tríceps\",\"Braquial\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1194.gif', NULL, '2026-07-18 19:43:11'),
(1195, 'Remo al mentón con Barra', 'Remo al mentón con Barra', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[\"Trapecio\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1195.gif', NULL, '2026-07-18 19:43:18'),
(1196, 'Press Militar Cerrado con Barra', 'Press Militar Cerrado con Barra', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[\"Tríceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1196.gif', NULL, '2026-07-18 19:43:25'),
(1197, 'Encogimientos en Press Militar con Barra', 'Encogimientos en Press Militar con Barra', NULL, NULL, 'Hombro', 'Hombro', 'Trapecio', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1197.gif', NULL, '2026-07-18 19:43:31'),
(1198, 'Press Militar Abierto con Barra', 'Press Militar Abierto con Barra', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[\"Tríceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1198.gif', NULL, '2026-07-18 19:43:38'),
(1199, 'Encogimientos Sentado con Barra', 'Encogimientos Sentado con Barra', NULL, NULL, 'Hombro', 'Hombro', 'Trapecio', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1199.gif', NULL, '2026-07-18 19:43:46'),
(1200, 'Elevación Frontal con giros con Barra Z', 'Elevación Frontal con giros con Barra Z', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[\"Trapecio\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1200.gif', NULL, '2026-07-18 19:43:52'),
(1201, 'Elevación Frontal en Pronación con Barra', 'Elevación Frontal en Pronación con Barra', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[\"Trapecio\",\"Tríceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1201.gif', NULL, '2026-07-18 19:43:59'),
(1202, 'Elevación Frontal Inclinada en Supinación con Barra Z', 'Elevación Frontal Inclinada en Supinación con Barra Z', NULL, NULL, 'Hombro', 'Hombro', 'Hombros', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1202.gif', NULL, '2026-07-18 19:44:06'),
(1203, 'Jalón en Pronación en Máquina', 'Jalón en Pronación en Máquina', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Braquial\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1203.gif', NULL, '2026-07-18 19:44:14'),
(1204, 'Jalón en Supinación en Máquina', 'Jalón en Supinación en Máquina', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Bíceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1204.gif', NULL, '2026-07-18 19:44:20'),
(1205, 'Remo Horizontal en Pronación en Máquina', 'Remo Horizontal en Pronación en Máquina', NULL, NULL, 'Espalda', 'Espalda', 'Dorsal', '[\"Espalda\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1205.gif', NULL, '2026-07-18 19:44:28'),
(1206, 'Remo Horizontal en Supinación en Máquina', 'Remo Horizontal en Supinación en Máquina', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1206.gif', NULL, '2026-07-18 19:44:35'),
(1207, 'Remo Horizontal Neutro en Máquina', 'Remo Horizontal Neutro en Máquina', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1207.gif', NULL, '2026-07-18 19:44:42'),
(1208, 'Remo en Barra T en Supinación', 'Remo en Barra T en Supinación', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1208.gif', NULL, '2026-07-18 19:44:48'),
(1209, 'Remo en Punta', 'Remo en Punta', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1209.gif', NULL, '2026-07-18 19:44:55'),
(1210, 'Remo Aislado en Punta', 'Remo Aislado en Punta', NULL, NULL, 'Espalda', 'Espalda', 'Hombros', '[\"Espalda\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1210.gif', NULL, '2026-07-18 19:45:02'),
(1211, 'Remo Aislado Neutro en Máquina Smith', 'Remo Aislado Neutro en Máquina Smith', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1211.gif', NULL, '2026-07-18 19:45:07'),
(1212, 'Dominada Invertida', 'Dominada Invertida', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\",\"Bíceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1212.gif', NULL, '2026-07-18 19:45:13'),
(1213, 'Dominada Cerrada Corta', 'Dominada Cerrada Corta', NULL, NULL, 'Espalda', 'Espalda', 'Antebrazo', '[\"Bíceps\",\"Hombros\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1213.gif', NULL, '2026-07-18 19:45:18'),
(1214, 'Dominada', 'Dominada', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Tríceps\",\"Bíceps\",\"Dorsal\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_1214.gif', NULL, '2026-07-18 19:45:24'),
(1215, 'Dominada Cerrada', 'Dominada Cerrada', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1215.gif', NULL, '2026-07-18 19:45:30'),
(1216, 'Dominada Cerrada en Martillo', 'Dominada Cerrada en Martillo', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Bíceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1216.gif', NULL, '2026-07-18 19:45:36'),
(1217, 'Dominada Abierta', 'Dominada Abierta', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1217.gif', NULL, '2026-07-18 19:45:42'),
(1218, 'Dominada a una mano', 'Dominada a una mano', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\",\"Cardio\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1218.gif', NULL, '2026-07-18 19:45:47'),
(1219, 'Dominada Lateral', 'Dominada Lateral', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Cardio\",\"Bíceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1219.gif', NULL, '2026-07-18 19:45:52'),
(1220, 'Dominada Circular en Supinación', 'Dominada Circular en Supinación', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Braquial\",\"Bíceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1220.gif', NULL, '2026-07-18 19:45:58'),
(1221, 'Retracción Escapular Colgado', 'Retracción Escapular Colgado', NULL, NULL, 'Espalda', 'Espalda', 'Trapecio', '[\"Braquial\",\"Bíceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1221.gif', NULL, '2026-07-18 19:46:06'),
(1222, 'Retracción Escapular entre Bancos', 'Retracción Escapular entre Bancos', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Trapecio\",\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1222.gif', NULL, '2026-07-18 19:46:12'),
(1223, 'Remo Colgado en Supinación', 'Remo Colgado en Supinación', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\",\"Bíceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1223.gif', NULL, '2026-07-18 19:46:20'),
(1224, 'Hiperextensiones', 'Hiperextensiones', NULL, NULL, 'Espalda', 'Espalda', 'Glúteo', '[\"Espalda\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1224.gif', NULL, '2026-07-18 19:46:24'),
(1225, 'Hiperextensiones Inclinadas', 'Hiperextensiones Inclinadas', NULL, NULL, 'Espalda', 'Espalda', 'Glúteo', '[\"Espalda\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1225.gif', NULL, '2026-07-18 19:46:30'),
(1226, 'Brazada en Fitball', 'Brazada en Fitball', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1226.gif', NULL, '2026-07-18 19:46:35'),
(1227, 'Hiperextensiones en Fitball', 'Hiperextensiones en Fitball', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1227.gif', NULL, '2026-07-18 19:46:41'),
(1228, 'Remo Aislado con Mancuerna', 'Remo Aislado con Mancuerna', NULL, NULL, 'Espalda', 'Espalda', 'Dorsal', '[\"Espalda\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1228.gif', NULL, '2026-07-18 19:46:57'),
(1229, 'Remo Inclinado Neutro con Mancuernas', 'Remo Inclinado Neutro con Mancuernas', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1229.gif', NULL, '2026-07-18 19:47:06'),
(1230, 'Remo Inclinado en Supinación con Mancuernas', 'Remo Inclinado en Supinación con Mancuernas', NULL, NULL, 'Espalda', 'Espalda', 'Dorsal', '[\"Espalda\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1230.gif', NULL, '2026-07-18 19:47:14'),
(1231, 'Remo en Pronación con Mancuernas', 'Remo en Pronación con Mancuernas', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1231.gif', NULL, '2026-07-18 19:47:18'),
(1232, 'Remo en Supinación con Mancuernas', 'Remo en Supinación con Mancuernas', NULL, NULL, 'Espalda', 'Espalda', 'Dorsal', '[\"Espalda\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1232.gif', NULL, '2026-07-18 19:47:23'),
(1233, 'Pullover con Barra Z', 'Pullover con Barra Z', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1233.gif', NULL, '2026-07-18 19:47:29'),
(1234, 'Remo Aislado con Barra', 'Remo Aislado con Barra', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1234.gif', NULL, '2026-07-18 19:47:35'),
(1235, 'Remo Inclinado en Supinación con Barra', 'Remo Inclinado en Supinación con Barra', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1235.gif', NULL, '2026-07-18 19:47:42'),
(1236, 'Remo Inclinado en Pronación con Barra', 'Remo Inclinado en Pronación con Barra', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1236.gif', NULL, '2026-07-18 19:47:48'),
(1237, 'Remo en Supinación con Barra', 'Remo en Supinación con Barra', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1237.gif', NULL, '2026-07-18 19:47:54'),
(1238, 'Remo en Pronación Abierto con Barra', 'Remo en Pronación Abierto con Barra', NULL, NULL, 'Espalda', 'Espalda', 'Espalda', '[\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1238.gif', NULL, '2026-07-18 19:48:01'),
(1239, 'Extensión Concentrada en Polea Baja', 'Extensión Concentrada en Polea Baja', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1239.gif', NULL, '2026-07-18 19:48:07'),
(1240, 'Extensión Concentrada en Polea Alta', 'Extensión Concentrada en Polea Alta', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1240.gif', NULL, '2026-07-18 19:48:14'),
(1241, 'Extensión Trasera Aislada en Polea Alta', 'Extensión Trasera Aislada en Polea Alta', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1241.gif', NULL, '2026-07-18 19:48:20'),
(1242, 'Extensión Vertical Aislada en Supinación en Polea Alta', 'Extensión Vertical Aislada en Supinación en Polea Alta', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1242.gif', NULL, '2026-07-18 19:48:26'),
(1243, 'Patadas Traseras en Polea', 'Patadas Traseras en Polea', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1243.gif', NULL, '2026-07-18 19:48:31'),
(1244, 'Extensión Vertical Neutra en Polea Alta', 'Extensión Vertical Neutra en Polea Alta', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1244.gif', NULL, '2026-07-18 19:48:37'),
(1245, 'Extensión Lateral Aislada en Supinación en Polea Alta', 'Extensión Lateral Aislada en Supinación en Polea Alta', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1245.gif', NULL, '2026-07-18 19:48:44'),
(1246, 'Extensión Vertical Aislada en Pronación en Polea Alta', 'Extensión Vertical Aislada en Pronación en Polea Alta', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1246.gif', NULL, '2026-07-18 19:48:51'),
(1247, 'Extensión Horizontal en Martillo en Polea Alta', 'Extensión Horizontal en Martillo en Polea Alta', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1247.gif', NULL, '2026-07-18 19:48:59'),
(1248, 'Press Francés Neutro con Polea', 'Press Francés Neutro con Polea', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1248.gif', NULL, '2026-07-18 19:49:04'),
(1249, 'Extensión Vertical en Pronación en Polea Baja', 'Extensión Vertical en Pronación en Polea Baja', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1249.gif', NULL, '2026-07-18 19:49:10'),
(1250, 'Extensión Vertical Aislada en Pronación en Polea Baja', 'Extensión Vertical Aislada en Pronación en Polea Baja', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1250.gif', NULL, '2026-07-18 19:49:16'),
(1251, 'Extensión Frontal Aislada en Polea Alta', 'Extensión Frontal Aislada en Polea Alta', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1251.gif', NULL, '2026-07-18 19:49:22'),
(1252, 'Extensiones Cruzadas en Polea', 'Extensiones Cruzadas en Polea', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1252.gif', NULL, '2026-07-18 19:49:27'),
(1253, 'Curl en Martillo en Polea Baja', 'Curl en Martillo en Polea Baja', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[\"Antebrazo\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1253.gif', NULL, '2026-07-18 19:49:33'),
(1254, 'Curl Vertical en Supinación con Polea', 'Curl Vertical en Supinación con Polea', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[\"Antebrazo\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1254.gif', NULL, '2026-07-18 19:49:40'),
(1255, 'Curl en Martillo en Polea Alta', 'Curl en Martillo en Polea Alta', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[\"Antebrazo\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1255.gif', NULL, '2026-07-18 19:49:44'),
(1256, 'Curl en Supinación en Polea Baja', 'Curl en Supinación en Polea Baja', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[\"Antebrazo\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1256.gif', NULL, '2026-07-18 19:49:50'),
(1257, 'Curl Lateral en Supinación con Polea', 'Curl Lateral en Supinación con Polea', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1257.gif', NULL, '2026-07-18 19:49:56'),
(1258, 'Curl Lateral en Supinación Aislado con Polea', 'Curl Lateral en Supinación Aislado con Polea', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1258.gif', NULL, '2026-07-18 19:50:02'),
(1259, 'Curl Aislado en Pronación en Polea Baja', 'Curl Aislado en Pronación en Polea Baja', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1259.gif', NULL, '2026-07-18 19:50:10'),
(1260, 'Curl en Pronación con agarre Z en Polea Baja', 'Curl en Pronación con agarre Z en Polea Baja', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[\"Antebrazo\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1260.gif', NULL, '2026-07-18 19:50:15'),
(1261, 'Curl en Supinación con agarre Z en Polea Baja', 'Curl en Supinación con agarre Z en Polea Baja', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1261.gif', NULL, '2026-07-18 19:50:22'),
(1262, 'Curl Concentrado Lateral Aislado en Supinación en Polea Baja', 'Curl Concentrado Lateral Aislado en Supinación en Polea Baja', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[\"Braquial\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1262.gif', NULL, '2026-07-18 19:50:28'),
(1263, 'Curl en Banco Scott Neutro con Polea', 'Curl en Banco Scott Neutro con Polea', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[\"Antebrazo\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1263.gif', NULL, '2026-07-18 19:50:33'),
(1264, 'Curl en Banco Scott Neutro Aislado con Polea', 'Curl en Banco Scott Neutro Aislado con Polea', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[\"Braquial\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1264.gif', NULL, '2026-07-18 19:50:39'),
(1265, 'Curl en Supinación en Polea Alta', 'Curl en Supinación en Polea Alta', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1265.gif', NULL, '2026-07-18 19:50:46'),
(1266, 'Curl en Banco Scott en Pronación Aislado con Polea', 'Curl en Banco Scott en Pronación Aislado con Polea', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[\"Antebrazo\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1266.gif', NULL, '2026-07-18 19:50:51'),
(1267, 'Curl en Banco Scott en Supinación Aislado con Polea', 'Curl en Banco Scott en Supinación Aislado con Polea', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[\"Braquial\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1267.gif', NULL, '2026-07-18 19:50:59'),
(1268, 'Curl en Supinación Retraído en Polea Baja', 'Curl en Supinación Retraído en Polea Baja', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1268.gif', NULL, '2026-07-18 19:51:04'),
(1269, 'Curl Concentrado Cerrado en Polea Baja', 'Curl Concentrado Cerrado en Polea Baja', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1269.gif', NULL, '2026-07-18 19:51:11'),
(1270, 'Curl en Supinación Cerrado en Polea Baja', 'Curl en Supinación Cerrado en Polea Baja', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1270.gif', NULL, '2026-07-18 19:51:17'),
(1271, 'Curl Horizontal Inclinado con Polea', 'Curl Horizontal Inclinado con Polea', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1271.gif', NULL, '2026-07-18 19:51:22'),
(1272, 'Curl Concentrado en Supinación en Polea Baja', 'Curl Concentrado en Supinación en Polea Baja', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1272.gif', NULL, '2026-07-18 19:51:28'),
(1273, 'Curl en V en Polea Baja', 'Curl en V en Polea Baja', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[\"Antebrazo\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1273.gif', NULL, '2026-07-18 19:51:33'),
(1274, 'Curl Horizontal en Supinación con Polea', 'Curl Horizontal en Supinación con Polea', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1274.gif', NULL, '2026-07-18 19:51:39'),
(1275, 'Curl Aislado Largo en Supinación en Polea Baja', 'Curl Aislado Largo en Supinación en Polea Baja', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1275.gif', NULL, '2026-07-18 19:51:44'),
(1276, 'Curl Concentrado Frontal Aislado en Supinación en Polea Baja', 'Curl Concentrado Frontal Aislado en Supinación en Polea Baja', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1276.gif', NULL, '2026-07-18 19:51:51'),
(1277, 'Curl con peso libre', 'Curl con peso libre', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[\"Antebrazo\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1277.gif', NULL, '2026-07-18 19:51:56'),
(1278, 'Curl Alterno en Supinación en Máquina', 'Curl Alterno en Supinación en Máquina', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[\"Antebrazo\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1278.gif', NULL, '2026-07-18 19:52:03'),
(1279, 'Curl Concentrado en Máquina', 'Curl Concentrado en Máquina', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[\"Antebrazo\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1279.gif', NULL, '2026-07-18 19:52:12'),
(1280, 'Curl en Pronación en Máquina Scott', 'Curl en Pronación en Máquina Scott', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[\"Antebrazo\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1280.gif', NULL, '2026-07-18 19:52:20'),
(1281, 'Curl en Martillo en Máquina Scott', 'Curl en Martillo en Máquina Scott', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[\"Antebrazo\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1281.gif', NULL, '2026-07-18 19:52:25'),
(1282, 'Curl en Supinación en Máquina Scott', 'Curl en Supinación en Máquina Scott', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[\"Braquial\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1282.gif', NULL, '2026-07-18 19:52:32'),
(1283, 'Curl con giro Alterno con Mancuernas', 'Curl con giro Alterno con Mancuernas', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[\"Antebrazo\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1283.gif', NULL, '2026-07-18 19:52:38'),
(1284, 'Curl Aislado en Pronación con Mancuerna', 'Curl Aislado en Pronación con Mancuerna', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[\"Antebrazo\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1284.gif', NULL, '2026-07-18 19:52:44'),
(1285, 'Curl Concentrado en Supinación con Mancuerna', 'Curl Concentrado en Supinación con Mancuerna', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[\"Antebrazo\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1285.gif', NULL, '2026-07-18 19:52:49'),
(1286, 'Curl Concentrado en Pronación con Mancuerna', 'Curl Concentrado en Pronación con Mancuerna', NULL, NULL, 'Bíceps', 'Bíceps', 'Braquial', '[\"Bíceps\",\"Antebrazo\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1286.gif', NULL, '2026-07-18 19:52:56'),
(1287, 'Curl en Banco Scott en Pronación con Mancuerna', 'Curl en Banco Scott en Pronación con Mancuerna', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1287.gif', NULL, '2026-07-18 19:53:02'),
(1288, 'Curl Horizontal en Supinación con Mancuernas', 'Curl Horizontal en Supinación con Mancuernas', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[\"Antebrazo\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1288.gif', NULL, '2026-07-18 19:53:07'),
(1289, 'Curl en Martillo Cruzado con Mancuernas', 'Curl en Martillo Cruzado con Mancuernas', NULL, NULL, 'Bíceps', 'Bíceps', 'Braquial', '[\"Bíceps\",\"Antebrazo\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1289.gif', NULL, '2026-07-18 19:53:13'),
(1290, 'Curl Aislado Neutro con Mancuerna', 'Curl Aislado Neutro con Mancuerna', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[\"Braquial\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1290.gif', NULL, '2026-07-18 19:53:18'),
(1291, 'Curl Aislado en Supinación con Mancuerna', 'Curl Aislado en Supinación con Mancuerna', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[\"Braquial\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1291.gif', NULL, '2026-07-18 19:53:22'),
(1292, 'Curl Spider Aislado Neutro con Mancuerna', 'Curl Spider Aislado Neutro con Mancuerna', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[\"Antebrazo\",\"Braquial\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1292.gif', NULL, '2026-07-18 19:53:28'),
(1293, 'Curl Spider Aislado en Pronación con Mancuerna', 'Curl Spider Aislado en Pronación con Mancuerna', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[\"Antebrazo\",\"Braquial\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1293.gif', NULL, '2026-07-18 19:53:33'),
(1294, 'Curl Spider Aislado en Supinación con Mancuerna', 'Curl Spider Aislado en Supinación con Mancuerna', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[\"Antebrazo\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1294.gif', NULL, '2026-07-18 19:53:38'),
(1295, 'Curl Lateral con Mancuernas', 'Curl Lateral con Mancuernas', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1295.gif', NULL, '2026-07-18 19:53:44'),
(1296, 'Curl en Banco Scott Neutro con Mancuerna', 'Curl en Banco Scott Neutro con Mancuerna', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[\"Braquial\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1296.gif', NULL, '2026-07-18 19:53:50'),
(1297, 'Curl Horizontal con Mancuernas', 'Curl Horizontal con Mancuernas', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1297.gif', NULL, '2026-07-18 19:53:55');
INSERT INTO `exercises` (`id`, `name`, `name_es`, `description`, `description_es`, `target_muscle`, `target_muscle_es`, `primary_muscle`, `secondary_muscles`, `is_warmup`, `media_type`, `media_url`, `local_media_path`, `created_by_trainer_id`, `created_at`) VALUES
(1298, 'Curl Spider Neutro con Mancuerna', 'Curl Spider Neutro con Mancuerna', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[\"Braquial\",\"Antebrazo\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1298.gif', NULL, '2026-07-18 19:54:03'),
(1299, 'Curl en Supinación Cerrado Con Barra Z', 'Curl en Supinación Cerrado Con Barra Z', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[\"Braquial\",\"Antebrazo\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1299.gif', NULL, '2026-07-18 19:54:10'),
(1300, 'Curl en Pronación con Barra Z', 'Curl en Pronación con Barra Z', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[\"Antebrazo\",\"Braquial\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1300.gif', NULL, '2026-07-18 19:54:16'),
(1301, 'Curl en Supinación Corto con Barra Z', 'Curl en Supinación Corto con Barra Z', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[\"Antebrazo\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1301.gif', NULL, '2026-07-18 19:54:21'),
(1302, 'Curl en Supinación con Barra Z', 'Curl en Supinación con Barra Z', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[\"Antebrazo\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1302.gif', NULL, '2026-07-18 19:54:25'),
(1303, 'Curl Spider en Supinación con Barra Z', 'Curl Spider en Supinación con Barra Z', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1303.gif', NULL, '2026-07-18 19:54:30'),
(1304, 'Curl Concentrado Cerrado con Barra Z', 'Curl Concentrado Cerrado con Barra Z', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1304.gif', NULL, '2026-07-18 19:54:34'),
(1305, 'Curl en Supinación Abierto Con Barra Z', 'Curl en Supinación Abierto Con Barra Z', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[\"Antebrazo\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1305.gif', NULL, '2026-07-18 19:54:44'),
(1306, 'Extensión en caída con Bandas', 'Extensión en caída con Bandas', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1306.gif', NULL, '2026-07-18 19:54:50'),
(1307, 'Curl en Supinación Abierto en banco Scott con Barra Z', 'Curl en Supinación Abierto en banco Scott con Barra Z', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1307.gif', NULL, '2026-07-18 19:54:55'),
(1308, 'Curl en Supinación Cerrado en banco Scott con Barra Z', 'Curl en Supinación Cerrado en banco Scott con Barra Z', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1308.gif', NULL, '2026-07-18 19:55:01'),
(1309, 'Curl en Pronación en banco Scott con Barra Z', 'Curl en Pronación en banco Scott con Barra Z', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[\"Braquial\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1309.gif', NULL, '2026-07-18 19:55:07'),
(1310, 'Curl en Supinación hacia abajo con Barra Z', 'Curl en Supinación hacia abajo con Barra Z', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[\"Antebrazo\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1310.gif', NULL, '2026-07-18 19:55:13'),
(1311, 'Curl Aislado con Barra', 'Curl Aislado con Barra', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1311.gif', NULL, '2026-07-18 19:55:18'),
(1312, 'Curl en Supinación Retraído con Barra', 'Curl en Supinación Retraído con Barra', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[\"Antebrazo\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1312.gif', NULL, '2026-07-18 19:55:22'),
(1313, 'Curl en Pronación en banco Scott con Barra', 'Curl en Pronación en banco Scott con Barra', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[\"Antebrazo\",\"Braquial\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1313.gif', NULL, '2026-07-18 19:55:28'),
(1314, 'Curl en Pronación con Barra', 'Curl en Pronación con Barra', NULL, NULL, 'Bíceps', 'Bíceps', 'Antebrazo', '[\"Bíceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1314.gif', NULL, '2026-07-18 19:55:33'),
(1315, 'Curl en Martillo con Barra', 'Curl en Martillo con Barra', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[\"Antebrazo\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1315.gif', NULL, '2026-07-18 19:55:37'),
(1316, 'Curl en Supinación hacia abajo con Barra', 'Curl en Supinación hacia abajo con Barra', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1316.gif', NULL, '2026-07-18 19:55:42'),
(1317, 'Curl Spider en Supinación con Barra', 'Curl Spider en Supinación con Barra', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1317.gif', NULL, '2026-07-18 19:55:46'),
(1318, 'Curl Concentrado con Barra', 'Curl Concentrado con Barra', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1318.gif', NULL, '2026-07-18 19:55:52'),
(1319, 'Curl Spider en Pronación con Barra', 'Curl Spider en Pronación con Barra', NULL, NULL, 'Bíceps', 'Bíceps', 'Antebrazo', '[\"Bíceps\",\"Braquial\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1319.gif', NULL, '2026-07-18 19:55:57'),
(1320, 'Curl en Supinación Concentrado con Banda', 'Curl en Supinación Concentrado con Banda', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[\"Antebrazo\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1320.gif', NULL, '2026-07-18 19:56:03'),
(1321, 'Curl en Supinación Aislado con Banda', 'Curl en Supinación Aislado con Banda', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1321.gif', NULL, '2026-07-18 19:56:07'),
(1322, 'Curl en caída con Bandas', 'Curl en caída con Bandas', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[\"Braquial\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1322.gif', NULL, '2026-07-18 19:56:12'),
(1323, 'Curl en Supinación Alterno con Bandas', 'Curl en Supinación Alterno con Bandas', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[]', 1, 'gif', NULL, '/uploads/exercises/exercise_1323.gif', NULL, '2026-07-18 19:56:18'),
(1324, 'Curl en Supinación con Bandas', 'Curl en Supinación con Bandas', NULL, NULL, 'Bíceps', 'Bíceps', 'Bíceps', '[]', 1, 'gif', NULL, '/uploads/exercises/exercise_1324.gif', NULL, '2026-07-18 19:56:23'),
(1325, 'Extensión Vertical con Bandas', 'Extensión Vertical con Bandas', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1325.gif', NULL, '2026-07-18 19:56:29'),
(1326, 'Extensión hacia abajo con Bandas', 'Extensión hacia abajo con Bandas', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1326.gif', NULL, '2026-07-18 19:56:33'),
(1327, 'Extensión Lateral Aislada con Banda', 'Extensión Lateral Aislada con Banda', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1327.gif', NULL, '2026-07-18 19:56:39'),
(1328, 'Extensiones Inclinadas con Mancuernas', 'Extensiones Inclinadas con Mancuernas', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1328.gif', NULL, '2026-07-18 19:56:44'),
(1329, 'Extensiones Horizontales Internas con Mancuernas', 'Extensiones Horizontales Internas con Mancuernas', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1329.gif', NULL, '2026-07-18 19:56:49'),
(1330, 'Press Banca Neutro con Mancuernas', 'Press Banca Neutro con Mancuernas', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[\"Pecho\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1330.gif', NULL, '2026-07-18 19:56:54'),
(1331, 'Press Banca en Supinación Aislado con Mancuerna', 'Press Banca en Supinación Aislado con Mancuerna', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[\"Pecho\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1331.gif', NULL, '2026-07-18 19:57:18'),
(1332, 'Press Inclinado Aislado con Mancuerna', 'Press Inclinado Aislado con Mancuerna', NULL, NULL, 'Tríceps', 'Tríceps', 'Bíceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1332.gif', NULL, '2026-07-18 19:57:26'),
(1333, 'Press Declinado Aislado con Mancuerna', 'Press Declinado Aislado con Mancuerna', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1333.gif', NULL, '2026-07-18 19:57:32'),
(1334, 'Press Francés Inclinado Alterno con Mancuernas', 'Press Francés Inclinado Alterno con Mancuernas', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1334.gif', NULL, '2026-07-18 19:57:38'),
(1335, 'Patadas Traseras con Mancuernas', 'Patadas Traseras con Mancuernas', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1335.gif', NULL, '2026-07-18 19:57:44'),
(1336, 'Patadas Traseras Alternas con Mancuernas', 'Patadas Traseras Alternas con Mancuernas', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1336.gif', NULL, '2026-07-18 19:57:50'),
(1337, 'Extensión Vertical con Mancuerna', 'Extensión Vertical con Mancuerna', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1337.gif', NULL, '2026-07-18 19:57:55'),
(1338, 'Extensión Delante-Detrás con Mancuernas', 'Extensión Delante-Detrás con Mancuernas', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1338.gif', NULL, '2026-07-18 19:58:01'),
(1339, 'Extensión Horizontal con Barra', 'Extensión Horizontal con Barra', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1339.gif', NULL, '2026-07-18 19:58:07'),
(1340, 'Press Inclinado en Supinación con Barra', 'Press Inclinado en Supinación con Barra', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1340.gif', NULL, '2026-07-18 19:58:12'),
(1341, 'Press Francés Declinado con Barra', 'Press Francés Declinado con Barra', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1341.gif', NULL, '2026-07-18 19:58:18'),
(1342, 'Press Francés Inverso con Barra', 'Press Francés Inverso con Barra', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1342.gif', NULL, '2026-07-18 19:58:22'),
(1343, 'Press Francés con Barra', 'Press Francés con Barra', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1343.gif', NULL, '2026-07-18 19:58:27'),
(1344, 'Press Inclinado Cerrado con Barra', 'Press Inclinado Cerrado con Barra', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1344.gif', NULL, '2026-07-18 19:58:33'),
(1345, 'Press Cerrado en Supinación con Barra', 'Press Cerrado en Supinación con Barra', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[\"Pecho\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1345.gif', NULL, '2026-07-18 19:58:39'),
(1346, 'Extensión Vertical con Barra Z', 'Extensión Vertical con Barra Z', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1346.gif', NULL, '2026-07-18 19:58:46'),
(1347, 'Extensión Horizontal con Barra Z', 'Extensión Horizontal con Barra Z', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1347.gif', NULL, '2026-07-18 19:58:52'),
(1348, 'Press Francés con Barra Z', 'Press Francés con Barra Z', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1348.gif', NULL, '2026-07-18 19:58:58'),
(1349, 'Press Francés Declinado Cerrado con Barra Z', 'Press Francés Declinado Cerrado con Barra Z', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1349.gif', NULL, '2026-07-18 19:59:05'),
(1350, 'Press Francés Declinado Abierto con Barra Z', 'Press Francés Declinado Abierto con Barra Z', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1350.gif', NULL, '2026-07-18 19:59:10'),
(1351, 'Extensiones en Pronación en Máquina', 'Extensiones en Pronación en Máquina', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1351.gif', NULL, '2026-07-18 19:59:15'),
(1352, 'Extensiones en Máquina', 'Extensiones en Máquina', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1352.gif', NULL, '2026-07-18 19:59:19'),
(1353, 'Fondos en Máquina', 'Fondos en Máquina', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[\"Hombros\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1353.gif', NULL, '2026-07-18 19:59:25'),
(1354, 'Fondos en Pronación en Máquina', 'Fondos en Pronación en Máquina', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[\"Pecho\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1354.gif', NULL, '2026-07-18 19:59:31'),
(1355, 'Flexiones en supinación', 'Flexiones en supinación', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[\"Pecho\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1355.gif', NULL, '2026-07-18 19:59:40'),
(1356, 'Flexiones Cruzadas', 'Flexiones Cruzadas', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[\"Pecho\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1356.gif', NULL, '2026-07-18 19:59:47'),
(1357, 'Flexiones Básicas', 'Flexiones Básicas', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[\"Pecho\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1357.gif', NULL, '2026-07-18 19:59:54'),
(1358, 'Flexiones Diamante', 'Flexiones Diamante', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[\"Pecho\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1358.gif', NULL, '2026-07-18 19:59:59'),
(1359, 'Extensiones en caída libre', 'Extensiones en caída libre', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1359.gif', NULL, '2026-07-18 20:00:06'),
(1360, 'Fondos en banco', 'Fondos en banco', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[\"Hombros\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1360.gif', NULL, '2026-07-18 20:00:10'),
(1361, 'Fondos entre bancos', 'Fondos entre bancos', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1361.gif', NULL, '2026-07-18 20:00:16'),
(1362, 'Fondos Imposibles', 'Fondos Imposibles', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[\"Hombros\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1362.gif', NULL, '2026-07-18 20:00:21'),
(1363, 'Fondos Coreanos en Barra', 'Fondos Coreanos en Barra', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[\"Pecho\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1363.gif', NULL, '2026-07-18 20:00:26'),
(1364, 'Fondos Cerrados en Paralelas', 'Fondos Cerrados en Paralelas', NULL, NULL, 'Tríceps', 'Tríceps', 'Tríceps', '[\"Pecho\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1364.gif', NULL, '2026-07-18 20:00:31'),
(1365, 'Pullover Extenso con Mancuernas', 'Pullover Extenso con Mancuernas', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[\"Espalda\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1365.gif', NULL, '2026-07-18 20:00:38'),
(1366, 'Pullover con Mancuerna', 'Pullover con Mancuerna', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1366.gif', NULL, '2026-07-18 20:00:44'),
(1367, 'Press Declinado Neutro con Mancuernas', 'Press Declinado Neutro con Mancuernas', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[\"Tríceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1367.gif', NULL, '2026-07-18 20:00:51'),
(1368, 'Press Inclinado en Supinación con Mancuernas', 'Press Inclinado en Supinación con Mancuernas', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[\"Tríceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1368.gif', NULL, '2026-07-18 20:00:56'),
(1369, 'Press Aislado en Supinación con Mancuerna', 'Press Aislado en Supinación con Mancuerna', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1369.gif', NULL, '2026-07-18 20:01:01'),
(1370, 'Press Inclinado en Supinación con giro con Mancuernas', 'Press Inclinado en Supinación con giro con Mancuernas', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[\"Tríceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1370.gif', NULL, '2026-07-18 20:01:06'),
(1371, 'Dumbbell Incline One Arm Press', 'Press Inclinado Aislado con Mancuerna', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[\"Tríceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1371.gif', NULL, '2026-07-18 20:01:12'),
(1372, 'Aperturas Declinadas con giro con Mancuernas', 'Aperturas Declinadas con giro con Mancuernas', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[\"Tríceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1372.gif', NULL, '2026-07-18 20:01:20'),
(1373, 'Aperturas Declinadas con Mancuernas', 'Aperturas Declinadas con Mancuernas', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1373.gif', NULL, '2026-07-18 20:01:26'),
(1374, 'Aperturas Inclinadas con Mancuernas', 'Aperturas Inclinadas con Mancuernas', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1374.gif', NULL, '2026-07-18 20:01:32'),
(1375, 'Dumbbell Fly', 'Aperturas con Mancuernas', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[\"Hombros\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1375.gif', NULL, '2026-07-18 20:01:38'),
(1376, 'Press Banca Alterno con Mancuernas', 'Press Banca Alterno con Mancuernas', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[\"Tríceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1376.gif', NULL, '2026-07-18 20:01:44'),
(1377, 'Press Abierto Neutro con Mancuernas', 'Press Abierto Neutro con Mancuernas', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1377.gif', NULL, '2026-07-18 20:01:53'),
(1378, 'Press Cerrado Neutro con Mancuernas', 'Press Cerrado Neutro con Mancuernas', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[\"Tríceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1378.gif', NULL, '2026-07-18 20:01:59'),
(1379, 'Press Inclinado Cerrado Neutro con Mancuerna', 'Press Inclinado Cerrado Neutro con Mancuerna', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[\"Tríceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1379.gif', NULL, '2026-07-18 20:02:05'),
(1380, 'Flexiones a una mano asistidas', 'Flexiones a una mano asistidas', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[\"Tríceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1380.gif', NULL, '2026-07-18 20:02:12'),
(1381, 'Flexiones Archer', 'Flexiones Archer', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[\"Tríceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1381.gif', NULL, '2026-07-18 20:02:17'),
(1382, 'Flexiones Pliométricas con Palmada', 'Flexiones Pliométricas con Palmada', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[\"Tríceps\",\"Cardio\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1382.gif', NULL, '2026-07-18 20:02:25'),
(1383, 'Flexiones con Soportes', 'Flexiones con Soportes', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[\"Cardio\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_1383.gif', NULL, '2026-07-18 20:02:36'),
(1384, 'Flexiones', 'Flexiones', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[\"Tríceps\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_1384.gif', NULL, '2026-07-18 20:02:40'),
(1385, 'Press Svend', 'Press Svend', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[\"Tríceps\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_1385.gif', NULL, '2026-07-18 20:02:46'),
(1386, 'Fondos en Barra', 'Fondos en Barra', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[\"Tríceps\",\"Cardio\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1386.gif', NULL, '2026-07-18 20:02:51'),
(1387, 'Chest Dip', 'Fondos en Paralelas', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[\"Tríceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1387.gif', NULL, '2026-07-18 20:02:56'),
(1388, 'Aperturas en Máquina', 'Aperturas en Máquina', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1388.gif', NULL, '2026-07-18 20:03:02'),
(1389, 'Aperturas Extendidas en Máquina', 'Aperturas Extendidas en Máquina', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1389.gif', NULL, '2026-07-18 20:03:07'),
(1390, 'Press Banca en Máquina', 'Press Banca en Máquina', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1390.gif', NULL, '2026-07-18 20:03:14'),
(1391, 'Cruces en Máquina', 'Cruces en Máquina', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[\"Hombros\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1391.gif', NULL, '2026-07-18 20:03:20'),
(1392, 'Lever Seated Dip', 'Fondos en Máquina', NULL, NULL, 'Pecho', 'Pecho', 'Tríceps', '[\"Pecho\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1392.gif', NULL, '2026-07-18 20:03:25'),
(1393, 'Press Frontal Cerrado en Máquina', 'Press Frontal Cerrado en Máquina', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[\"Tríceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1393.gif', NULL, '2026-07-18 20:03:30'),
(1394, 'Press Inclinado en Máquina', 'Press Inclinado en Máquina', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1394.gif', NULL, '2026-07-18 20:03:35'),
(1395, 'Press Frontal Inferior en Máquina', 'Press Frontal Inferior en Máquina', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[\"Tríceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1395.gif', NULL, '2026-07-18 20:03:43'),
(1396, 'Press Frontal en Máquina', 'Press Frontal en Máquina', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[\"Tríceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1396.gif', NULL, '2026-07-18 20:03:50'),
(1397, 'Apertura Aislada en Punta', 'Apertura Aislada en Punta', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[\"Bíceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1397.gif', NULL, '2026-07-18 20:03:58'),
(1398, 'Press Declinado Inverso con Barra', 'Press Declinado Inverso con Barra', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[\"Tríceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1398.gif', NULL, '2026-07-18 20:04:03'),
(1399, 'Press Inclinado Inverso con Barra', 'Press Inclinado Inverso con Barra', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[\"Tríceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1399.gif', NULL, '2026-07-18 20:04:09'),
(1400, 'Pullover con Barra', 'Pullover con Barra', NULL, NULL, 'Pecho', 'Pecho', 'Tríceps', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1400.gif', NULL, '2026-07-18 20:04:16'),
(1401, 'Press Cerrado en Máquina Smith', 'Press Cerrado en Máquina Smith', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[\"Tríceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1401.gif', NULL, '2026-07-18 20:04:22'),
(1402, 'Press Banca Abierto con Barra', 'Press Banca Abierto con Barra', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[\"Tríceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1402.gif', NULL, '2026-07-18 20:04:32'),
(1403, 'Pullover con cuerda en Polea', 'Pullover con cuerda en Polea', NULL, NULL, 'Pecho', 'Pecho', 'Espalda', '[\"Dorsal\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1403.gif', NULL, '2026-07-18 20:04:39'),
(1404, 'Apertura Aislada Declinada con Polea', 'Apertura Aislada Declinada con Polea', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1404.gif', NULL, '2026-07-18 20:04:45'),
(1405, 'Press Declinado Aislado con Polea', 'Press Declinado Aislado con Polea', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1405.gif', NULL, '2026-07-18 20:04:50'),
(1406, 'Cruce completo de Poleas', 'Cruce completo de Poleas', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[\"Hombros\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1406.gif', NULL, '2026-07-18 20:04:54'),
(1407, 'Cruce inferior de Poleas', 'Cruce inferior de Poleas', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[\"Hombros\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1407.gif', NULL, '2026-07-18 20:04:58'),
(1408, 'Cruce superior de Poleas', 'Cruce superior de Poleas', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[\"Hombros\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1408.gif', NULL, '2026-07-18 20:05:04'),
(1409, 'Cruce de Poleas', 'Cruce de Poleas', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[\"Hombros\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1409.gif', NULL, '2026-07-18 20:05:09'),
(1410, 'Press Inclinado Aislado con Polea', 'Press Inclinado Aislado con Polea', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[\"Tríceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1410.gif', NULL, '2026-07-18 20:05:14'),
(1411, 'Press Banca Aislado con Polea', 'Press Banca Aislado con Polea', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[\"Tríceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1411.gif', NULL, '2026-07-18 20:05:20'),
(1412, 'Press Frontal a una mano en Polea', 'Press Frontal a una mano en Polea', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[\"Core/Abdomen\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1412.gif', NULL, '2026-07-18 20:05:25'),
(1413, 'Press Frontal Cerrado con Poleas', 'Press Frontal Cerrado con Poleas', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[\"Tríceps\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1413.gif', NULL, '2026-07-18 20:05:31'),
(1414, 'Press Frontal Neutral con Polea', 'Press Frontal Neutral con Polea', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[\"Core/Abdomen\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1414.gif', NULL, '2026-07-18 20:05:35'),
(1415, 'Press Frontal Inclinado con Bandas', 'Press Frontal Inclinado con Bandas', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[\"Tríceps\",\"Core/Abdomen\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_1415.gif', NULL, '2026-07-18 20:05:39'),
(1416, 'Aperturas con Bandas', 'Aperturas con Bandas', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1416.gif', NULL, '2026-07-18 20:05:44'),
(1417, 'Press Frontal en Pronación con Bandas', 'Press Frontal en Pronación con Bandas', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1417.gif', NULL, '2026-07-18 20:05:48'),
(1418, 'Press Frontal Neutral con Banda', 'Press Frontal Neutral con Banda', NULL, NULL, 'Pecho', 'Pecho', 'Pecho', '[\"Core/Abdomen\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1418.gif', NULL, '2026-07-18 20:05:53'),
(1419, 'Carrera continua', 'Carrera continua', NULL, NULL, 'Todos', 'Todos', 'Cardio', '[]', 1, 'gif', NULL, '/uploads/exercises/exercise_1419.gif', NULL, '2026-07-18 20:05:58'),
(1420, 'Burpee', 'Burpee', NULL, NULL, 'Todos', 'Todos', 'Full Body', '[\"Cardio\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_1420.gif', NULL, '2026-07-18 20:06:03'),
(1421, 'Burpee con Mancuernas', 'Burpee con Mancuernas', NULL, NULL, 'Todos', 'Todos', 'Full Body', '[\"Cardio\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_1421.gif', NULL, '2026-07-18 20:06:09'),
(1422, 'Burpee Jack', 'Burpee Jack', NULL, NULL, 'Todos', 'Todos', 'Full Body', '[\"Cardio\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_1422.gif', NULL, '2026-07-18 20:06:15'),
(1423, 'Caminar con peso', 'Caminar con peso', NULL, NULL, 'Todos', 'Todos', 'Full Body', '[\"Pierna\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1423.gif', NULL, '2026-07-18 20:06:20'),
(1424, 'Caminar', 'Caminar', NULL, NULL, 'Todos', 'Todos', 'Cardio', '[\"Pierna\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_1424.gif', NULL, '2026-07-18 20:06:26'),
(1425, 'Paso lateral con Banda', 'Paso lateral con Banda', NULL, NULL, 'Todos', 'Todos', 'Full Body', '[\"Pierna\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_1425.gif', NULL, '2026-07-18 20:06:32'),
(1426, 'Caminar a paso ligero', 'Caminar a paso ligero', NULL, NULL, 'Todos', 'Todos', 'Cardio', '[]', 1, 'gif', NULL, '/uploads/exercises/exercise_1426.gif', NULL, '2026-07-18 20:06:37'),
(1427, 'Butt Kicks', 'Butt Kicks', NULL, NULL, 'Todos', 'Todos', 'Cardio', '[\"Full Body\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1427.gif', NULL, '2026-07-18 20:06:43'),
(1428, 'Split Jacks', 'Split Jacks', NULL, NULL, 'Todos', 'Todos', 'Full Body', '[\"Cardio\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1428.gif', NULL, '2026-07-18 20:06:49'),
(1429, 'Mountain Climber', 'Mountain Climbers', NULL, NULL, 'Todos', 'Todos', 'Cardio', '[\"Full Body\",\"Core/Abdomen\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1429.gif', NULL, '2026-07-18 20:06:54'),
(1430, 'Carrera de skater', 'Carrera de skater', NULL, NULL, 'Todos', 'Todos', 'Cardio', '[\"Core/Abdomen\",\"Full Body\",\"Pierna\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1430.gif', NULL, '2026-07-18 20:07:01'),
(1431, 'Plyo Jacks', 'Plyo Jacks', NULL, NULL, 'Todos', 'Todos', 'Full Body', '[\"Cardio\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_1431.gif', NULL, '2026-07-18 20:07:06'),
(1432, 'Jumping Jacks', 'Jumping Jacks', NULL, NULL, 'Todos', 'Todos', 'Cardio', '[\"Full Body\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1432.gif', NULL, '2026-07-18 20:07:11'),
(1433, 'Rodilla al codo con sentadilla', 'Rodilla al codo con sentadilla', NULL, NULL, 'Todos', 'Todos', 'Full Body', '[\"Cardio\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1433.gif', NULL, '2026-07-18 20:07:17'),
(1434, 'Rodilla al codo', 'Rodilla al codo', NULL, NULL, 'Todos', 'Todos', 'Cardio', '[\"Full Body\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1434.gif', NULL, '2026-07-18 20:07:23'),
(1435, 'Rodilla al codo con giro', 'Rodilla al codo con giro', NULL, NULL, 'Todos', 'Todos', 'Full Body', '[\"Cardio\",\"Core/Abdomen\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1435.gif', NULL, '2026-07-18 20:07:28'),
(1436, 'Pies rápidos de pie', 'Pies rápidos de pie', NULL, NULL, 'Todos', 'Todos', 'Cardio', '[\"Cuádriceps\",\"Full Body\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_1436.gif', NULL, '2026-07-18 20:07:34'),
(1437, 'Salto alterno en el sitio', 'Salto alterno en el sitio', NULL, NULL, 'Todos', 'Todos', 'Cardio', '[\"Full Body\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1437.gif', NULL, '2026-07-18 20:07:39'),
(1438, 'Carrera en zigzag', 'Carrera en zigzag', NULL, NULL, 'Todos', 'Todos', 'Cardio', '[\"Full Body\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1438.gif', NULL, '2026-07-18 20:07:43'),
(1439, 'Skips', 'Skips', NULL, NULL, 'Todos', 'Todos', 'Cardio', '[\"Full Body\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1439.gif', NULL, '2026-07-18 20:07:49'),
(1440, 'Carrera rápida en el sitio', 'Carrera rápida en el sitio', NULL, NULL, 'Todos', 'Todos', 'Cardio', '[\"Full Body\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1440.gif', NULL, '2026-07-18 20:07:55'),
(1441, 'Elevación de rodillas con apoyo', 'Elevación de rodillas con apoyo', NULL, NULL, 'Todos', 'Todos', 'Full Body', '[\"Cardio\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1441.gif', NULL, '2026-07-18 20:08:01'),
(1442, 'Pies rápidos agachado', 'Pies rápidos agachado', NULL, NULL, 'Todos', 'Todos', 'Cardio', '[\"Full Body\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1442.gif', NULL, '2026-07-18 20:08:07'),
(1443, 'Patadas altas', 'Patadas altas', NULL, NULL, 'Todos', 'Todos', 'Cardio', '[\"Full Body\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1443.gif', NULL, '2026-07-18 20:08:12'),
(1444, 'Carrera con salto', 'Carrera con salto', NULL, NULL, 'Todos', 'Todos', 'Cardio', '[\"Full Body\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_1444.gif', NULL, '2026-07-18 20:08:19'),
(1445, 'Carrera de pasos cortos', 'Carrera de pasos cortos', NULL, NULL, 'Todos', 'Todos', 'Cardio', '[\"Full Body\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1445.gif', NULL, '2026-07-18 20:08:27'),
(1446, 'Caminar con rodilla arriba', 'Caminar con rodilla arriba', NULL, NULL, 'Todos', 'Todos', 'Pierna', '[\"Full Body\",\"Cardio\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_1446.gif', NULL, '2026-07-18 20:08:32'),
(1447, 'Salto con desplazamiento lateral cruzado', 'Salto con desplazamiento lateral cruzado', NULL, NULL, 'Todos', 'Todos', 'Cardio', '[\"Full Body\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1447.gif', NULL, '2026-07-18 20:08:38'),
(1448, 'Salto de esquí', 'Salto de esquí', NULL, NULL, 'Todos', 'Todos', 'Cardio', '[\"Full Body\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1448.gif', NULL, '2026-07-18 20:08:44'),
(1449, 'Salto con desplazamiento lateral', 'Salto con desplazamiento lateral', NULL, NULL, 'Todos', 'Todos', 'Cardio', '[\"Full Body\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1449.gif', NULL, '2026-07-18 20:08:48'),
(1450, 'Golpes alternos', 'Golpes alternos', NULL, NULL, 'Todos', 'Todos', 'Cardio', '[\"Full Body\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_1450.gif', NULL, '2026-07-18 20:08:54'),
(1451, 'Desplazamientos de Boxeo', 'Desplazamientos de Boxeo', NULL, NULL, 'Todos', 'Todos', 'Cardio', '[\"Full Body\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_1451.gif', NULL, '2026-07-18 20:08:58'),
(1452, 'Elevación de rodillas', 'Elevación de rodillas', NULL, NULL, 'Todos', 'Todos', 'Cardio', '[\"Full Body\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1452.gif', NULL, '2026-07-18 20:09:04'),
(1453, 'Zancada con salto', 'Zancada con salto', NULL, NULL, 'Todos', 'Todos', 'Full Body', '[\"Cardio\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1453.gif', NULL, '2026-07-18 20:09:10'),
(1454, 'Squat Tuck Jumps', 'Squat Tuck Jumps', NULL, NULL, 'Todos', 'Todos', 'Full Body', '[\"Cardio\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1454.gif', NULL, '2026-07-18 20:09:18'),
(1455, 'Tuck Jumps', 'Tuck Jumps', NULL, NULL, 'Todos', 'Todos', 'Full Body', '[\"Cardio\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1455.gif', NULL, '2026-07-18 20:09:25'),
(1456, 'Sprints con rodilla alta', 'Sprints con rodilla alta', NULL, NULL, 'Todos', 'Todos', 'Cardio', '[\"Full Body\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1456.gif', NULL, '2026-07-18 20:09:31'),
(1457, 'Step Up', 'Step Up', NULL, NULL, 'Todos', 'Todos', 'Cardio', '[\"Full Body\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1457.gif', NULL, '2026-07-18 20:09:37'),
(1458, 'Carrera hacia atrás', 'Carrera hacia atrás', NULL, NULL, 'Todos', 'Todos', 'Cardio', '[\"Full Body\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1458.gif', NULL, '2026-07-18 20:09:43'),
(1459, 'Caminar en cuclillas', 'Caminar en cuclillas', NULL, NULL, 'Todos', 'Todos', 'Cardio', '[\"Full Body\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1459.gif', NULL, '2026-07-18 20:09:50'),
(1460, 'Máquina Escaladora', 'Máquina Escaladora', NULL, NULL, 'Todos', 'Todos', 'Cardio', '[\"Full Body\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_1460.gif', NULL, '2026-07-18 20:09:55'),
(1461, 'Máquina Elíptica', 'Máquina Elíptica', NULL, NULL, 'Todos', 'Todos', 'Cardio', '[\"Pierna\",\"Full Body\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_1461.gif', NULL, '2026-07-18 20:10:00'),
(1462, 'Máquina de Step', 'Máquina de Step', NULL, NULL, 'Todos', 'Todos', 'Cardio', '[\"Full Body\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_1462.gif', NULL, '2026-07-18 20:10:05'),
(1463, 'Krankcycle', 'Krankcycle', NULL, NULL, 'Todos', 'Todos', 'Cardio', '[\"Full Body\"]', 0, 'gif', NULL, '/uploads/exercises/exercise_1463.gif', NULL, '2026-07-18 20:10:11'),
(1464, 'Bicicleta Estática Normal', 'Bicicleta Estática Normal', NULL, NULL, 'Todos', 'Todos', 'Cardio', '[\"Pierna\",\"Full Body\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_1464.gif', NULL, '2026-07-18 20:10:14'),
(1465, 'Bicicleta Estática Deportiva', 'Bicicleta Estática Deportiva', NULL, NULL, 'Todos', 'Todos', 'Cardio', '[\"Full Body\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_1465.gif', NULL, '2026-07-18 20:10:19'),
(1466, 'Máquina de Remo', 'Máquina de Remo', NULL, NULL, 'Todos', 'Todos', 'Cardio', '[\"Full Body\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_1466.gif', NULL, '2026-07-18 20:10:24'),
(1467, 'Carrera en Cinta Inclinada', 'Carrera en Cinta Inclinada', NULL, NULL, 'Todos', 'Todos', 'Cardio', '[\"Full Body\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_1467.gif', NULL, '2026-07-18 20:10:29'),
(1468, 'Carrera en Cinta', 'Carrera en Cinta', NULL, NULL, 'Todos', 'Todos', 'Cardio', '[\"Full Body\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_1468.gif', NULL, '2026-07-18 20:10:34'),
(1469, 'Bicicleta Estática Reclinada', 'Bicicleta Estática Reclinada', NULL, NULL, 'Todos', 'Todos', 'Cardio', '[\"Full Body\",\"Pierna\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_1469.gif', NULL, '2026-07-18 20:10:39'),
(1470, 'Assault Bike Run', 'Air Bike', NULL, NULL, 'Todos', 'Todos', 'Cardio', '[\"Full Body\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_1470.gif', NULL, '2026-07-18 20:10:45'),
(1471, 'Salto con Cuerda Alterno Alto', 'Salto con Cuerda Alterno Alto', NULL, NULL, 'Todos', 'Todos', 'Cardio', '[\"Full Body\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_1471.gif', NULL, '2026-07-18 20:10:49'),
(1472, 'Salto con Cuerda Alterno Normal', 'Salto con Cuerda Alterno Normal', NULL, NULL, 'Todos', 'Todos', 'Cardio', '[\"Full Body\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_1472.gif', NULL, '2026-07-18 20:10:54'),
(1473, 'Salto con Cuerda Alto', 'Salto con Cuerda Alto', NULL, NULL, 'Todos', 'Todos', 'Cardio', '[\"Full Body\",\"Pierna\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_1473.gif', NULL, '2026-07-18 20:10:58'),
(1474, 'Salto con Cuerda Lateral', 'Salto con Cuerda Lateral', NULL, NULL, 'Todos', 'Todos', 'Cardio', '[\"Full Body\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_1474.gif', NULL, '2026-07-18 20:11:03'),
(1475, 'Salto con Cuerda Normal', 'Salto con Cuerda Normal', NULL, NULL, 'Todos', 'Todos', 'Cardio', '[\"Full Body\",\"Pierna\"]', 1, 'gif', NULL, '/uploads/exercises/exercise_1475.gif', NULL, '2026-07-18 20:11:07'),
(1476, 'Flexión Frontal con Disco', 'Flexión Frontal con Disco', NULL, NULL, 'Cuello', 'Cuello', 'Cardio', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1476.gif', NULL, '2026-07-18 20:11:12'),
(1477, 'Extensión Frontal con Disco', 'Extensión Frontal con Disco', NULL, NULL, 'Cuello', 'Cuello', 'Full Body', '[]', 1, 'gif', NULL, '/uploads/exercises/exercise_1477.gif', NULL, '2026-07-18 20:11:17'),
(1478, 'Extensión Frontal con Arnés', 'Extensión Frontal con Arnés', NULL, NULL, 'Cuello', 'Cuello', 'Full Body', '[]', 1, 'gif', NULL, '/uploads/exercises/exercise_1478.gif', NULL, '2026-07-18 20:11:22'),
(1479, 'Extensión Lateral con Arnés', 'Extensión Lateral con Arnés', NULL, NULL, 'Cuello', 'Cuello', 'Full Body', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1479.gif', NULL, '2026-07-18 20:11:27'),
(1480, 'Flexión Frontal en Polea', 'Flexión Frontal en Polea', NULL, NULL, 'Cuello', 'Cuello', 'Full Body', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1480.gif', NULL, '2026-07-18 20:11:33'),
(1481, 'Extensión Frontal en Polea', 'Extensión Frontal en Polea', NULL, NULL, 'Cuello', 'Cuello', 'Full Body', '[]', 1, 'gif', NULL, '/uploads/exercises/exercise_1481.gif', NULL, '2026-07-18 20:11:39'),
(1482, 'Extensión Lateral en Máquina', 'Extensión Lateral en Máquina', NULL, NULL, 'Cuello', 'Cuello', 'Full Body', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1482.gif', NULL, '2026-07-18 20:11:45'),
(1483, 'Lever Neck Extension plate loaded', 'Extensión Frontal en Máquina', NULL, NULL, 'Cuello', 'Cuello', 'Full Body', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1483.gif', NULL, '2026-07-18 20:11:49'),
(1484, 'Curl a una mano en Polea Alta', 'Curl a una mano en Polea Alta', NULL, NULL, 'Antebrazo', 'Antebrazo', 'Antebrazo', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1484.gif', NULL, '2026-07-18 20:11:54'),
(1485, 'Curl Vertical en Polea Baja', 'Curl Vertical en Polea Baja', NULL, NULL, 'Antebrazo', 'Antebrazo', 'Antebrazo', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1485.gif', NULL, '2026-07-18 20:11:59'),
(1486, 'Curl Concentrado en Pronación con Polea', 'Curl Concentrado en Pronación con Polea', NULL, NULL, 'Antebrazo', 'Antebrazo', 'Antebrazo', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1486.gif', NULL, '2026-07-18 20:12:04'),
(1487, 'Hand Grip', 'Hand Grip', NULL, NULL, 'Antebrazo', 'Antebrazo', 'Antebrazo', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1487.gif', NULL, '2026-07-18 20:12:09'),
(1488, 'Rotación Concentrada con Mancuerna', 'Rotación Concentrada con Mancuerna', NULL, NULL, 'Antebrazo', 'Antebrazo', 'Antebrazo', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1488.gif', NULL, '2026-07-18 20:12:15'),
(1489, 'Curl Concentrado Neutral con Mancuerna', 'Curl Concentrado Neutral con Mancuerna', NULL, NULL, 'Antebrazo', 'Antebrazo', 'Antebrazo', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1489.gif', NULL, '2026-07-18 20:12:20'),
(1490, 'Dumbbell One arm Revers Wrist Curl', 'Curl Concentrado en Pronación con Mancuerna', NULL, NULL, 'Antebrazo', 'Antebrazo', 'Antebrazo', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1490.gif', NULL, '2026-07-18 20:12:26'),
(1491, 'Dumbbell One arm Wrist Curl', 'Curl Concentrado en Supinación con Mancuerna', NULL, NULL, 'Antebrazo', 'Antebrazo', 'Antebrazo', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1491.gif', NULL, '2026-07-18 20:12:32'),
(1492, 'Curl Inclinado con Barra', 'Curl Inclinado con Barra', NULL, NULL, 'Antebrazo', 'Antebrazo', 'Antebrazo', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1492.gif', NULL, '2026-07-18 20:12:37'),
(1493, 'Curl Vertical en Supinación con Barra', 'Curl Vertical en Supinación con Barra', NULL, NULL, 'Antebrazo', 'Antebrazo', 'Antebrazo', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1493.gif', NULL, '2026-07-18 20:12:41'),
(1494, 'Curl Vertical de Dedos con Barra', 'Curl Vertical de Dedos con Barra', NULL, NULL, 'Antebrazo', 'Antebrazo', 'Antebrazo', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1494.gif', NULL, '2026-07-18 20:12:46'),
(1495, 'Curl Concentrado en Pronación con Barra', 'Curl Concentrado en Pronación con Barra', NULL, NULL, 'Antebrazo', 'Antebrazo', 'Antebrazo', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1495.gif', NULL, '2026-07-18 20:12:52'),
(1496, 'Curl Concentrado en Supinación con Barra', 'Curl Concentrado en Supinación con Barra', NULL, NULL, 'Antebrazo', 'Antebrazo', 'Antebrazo', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1496.gif', NULL, '2026-07-18 20:12:57'),
(1497, 'Curl Concentrado en Pronación con Banda', 'Curl Concentrado en Pronación con Banda', NULL, NULL, 'Antebrazo', 'Antebrazo', 'Antebrazo', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1497.gif', NULL, '2026-07-18 20:13:02'),
(1498, 'Curl Concentrado en Supinación con Banda', 'Curl Concentrado en Supinación con Banda', NULL, NULL, 'Antebrazo', 'Antebrazo', 'Antebrazo', '[]', 0, 'gif', NULL, '/uploads/exercises/exercise_1498.gif', NULL, '2026-07-18 20:13:07');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `habits`
--

CREATE TABLE `habits` (
  `id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `trainer_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `habits`
--

INSERT INTO `habits` (`id`, `client_id`, `trainer_id`, `title`, `created_at`) VALUES
(1, 5, 1, 'Beber 2L de agua', '2026-07-15 22:48:48');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `habit_logs`
--

CREATE TABLE `habit_logs` (
  `id` int(11) NOT NULL,
  `habit_id` int(11) NOT NULL,
  `logged_date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `invitaciones`
--

CREATE TABLE `invitaciones` (
  `id` int(11) NOT NULL,
  `token` varchar(64) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending' COMMENT 'pending|used|revoked',
  `trainer_id` int(11) DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `invitaciones`
--

INSERT INTO `invitaciones` (`id`, `token`, `status`, `trainer_id`, `fecha_creacion`) VALUES
(1, '6bd0578654d0c5df', 'pending', NULL, '2026-07-10 23:16:27'),
(3, 'a9ea18d1d15463f0', 'used', NULL, '2026-07-11 21:59:10'),
(4, '5575c381770f0283', 'used', NULL, '2026-07-11 22:09:44'),
(5, 'ceb663e451e437b1', 'used', 1, '2026-07-11 23:11:22'),
(6, '2201d47ca8dae804', 'used', 6, '2026-07-11 23:32:02'),
(7, 'bfa44c99c317f48e', 'used', 6, '2026-07-12 02:29:08'),
(8, '46a002bb5a479cbe', 'used', 1, '2026-07-14 20:00:58'),
(9, '02fd425d91ec8ba1', 'revoked', 1, '2026-07-14 20:00:58'),
(10, '303bb7c88da65677', 'revoked', 1, '2026-07-14 20:00:59'),
(11, '4063ac79a6dce438', 'revoked', 1, '2026-07-14 20:03:05'),
(12, 'af41a01ab8fe9ca9', 'used', 6, '2026-07-16 18:50:49');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `messages`
--

INSERT INTO `messages` (`id`, `sender_id`, `receiver_id`, `content`, `is_read`, `created_at`) VALUES
(1, 1, 5, 'Hola Camila', 1, '2026-07-15 19:57:18'),
(2, 5, 1, 'hola Jhon', 1, '2026-07-15 19:57:51');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `message` text NOT NULL,
  `type` enum('routine_assigned','routine_completed','system','pr_achieved','streak_milestone','streak_at_risk') NOT NULL DEFAULT 'system',
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES
(1, 4, 'Smoke test client', 'Test notification for client', 'system', 0, '2026-07-15 02:12:24'),
(2, 1, 'Smoke test trainer', 'Test notification for trainer', 'system', 1, '2026-07-15 02:12:24'),
(3, 4, 'Diag create', 'Created via service for diagnosis', 'system', 0, '2026-07-15 02:25:24'),
(4, 5, 'Rutina actualizada', 'Tu entrenador ha actualizado la rutina: general', 'routine_assigned', 1, '2026-07-15 16:31:22'),
(5, 1, 'Entrenamiento completado', 'Camila Londoñez ha completado la rutina: general', 'routine_completed', 1, '2026-07-15 16:33:45'),
(6, 1, 'Entrenamiento completado', 'Camila Londoñez ha completado la rutina: general', 'routine_completed', 1, '2026-07-15 16:44:45'),
(7, 5, 'Rutina actualizada', 'Tu entrenador ha actualizado la rutina: general', 'routine_assigned', 1, '2026-07-15 18:22:00'),
(8, 5, 'Rutina actualizada', 'Tu entrenador ha actualizado la rutina: general', 'routine_assigned', 1, '2026-07-15 18:23:09'),
(9, 5, 'Rutina actualizada', 'Tu entrenador ha actualizado la rutina: general', 'routine_assigned', 1, '2026-07-15 18:24:06'),
(10, 5, 'Rutina actualizada', 'Tu entrenador ha actualizado la rutina: general', 'routine_assigned', 1, '2026-07-15 18:30:07'),
(11, 1, 'Entrenamiento completado', 'Camila Londoñez ha completado la rutina: general', 'routine_completed', 1, '2026-07-15 18:31:11'),
(12, 5, 'Rutina actualizada', 'Tu entrenador ha actualizado la rutina: general', 'routine_assigned', 0, '2026-07-15 18:51:33'),
(13, 1, 'Entrenamiento completado', 'Camila Londoñez ha completado la rutina: general', 'routine_completed', 1, '2026-07-15 18:53:15'),
(14, 4, 'Rutina actualizada', 'Tu entrenador ha actualizado la rutina: Pierna', 'routine_assigned', 0, '2026-07-15 18:59:32'),
(15, 4, 'Rutina actualizada', 'Tu entrenador ha actualizado la rutina: Pierna', 'routine_assigned', 0, '2026-07-15 19:00:28'),
(16, 4, 'Rutina actualizada', 'Tu entrenador ha actualizado la rutina: Pierna', 'routine_assigned', 0, '2026-07-15 19:01:36'),
(17, 4, 'Rutina actualizada', 'Tu entrenador ha actualizado la rutina: Pierna', 'routine_assigned', 0, '2026-07-15 19:02:25'),
(18, 4, 'Rutina actualizada', 'Tu entrenador ha actualizado la rutina: Pierna', 'routine_assigned', 0, '2026-07-15 19:02:53'),
(19, 4, 'Rutina actualizada', 'Tu entrenador ha actualizado la rutina: Pierna', 'routine_assigned', 0, '2026-07-15 19:03:15'),
(20, 4, 'Rutina actualizada', 'Tu entrenador ha actualizado la rutina: Pierna', 'routine_assigned', 0, '2026-07-15 19:04:07'),
(21, 4, 'Rutina actualizada', 'Tu entrenador ha actualizado la rutina: Pierna', 'routine_assigned', 0, '2026-07-15 19:05:20'),
(22, 5, 'Rutina actualizada', 'Tu entrenador ha actualizado la rutina: general', 'routine_assigned', 0, '2026-07-15 19:07:12'),
(23, 1, 'Entrenamiento completado', 'Camila Londoñez ha completado la rutina: general', 'routine_completed', 1, '2026-07-15 19:08:24'),
(24, 5, 'Nueva rutina asignada', 'Tu entrenador ha creado la rutina: Empuje', 'routine_assigned', 1, '2026-07-16 22:52:55'),
(25, 1, 'Entrenamiento completado', 'Camila Londoñez ha completado la rutina: Empuje', 'routine_completed', 1, '2026-07-16 22:54:10'),
(26, 1, 'Entrenamiento completado', 'Camila Londoñez ha completado la rutina: Empuje', 'routine_completed', 1, '2026-07-16 23:05:07'),
(27, 5, 'Nueva rutina asignada', 'Tu entrenador ha creado la rutina: hiit', 'routine_assigned', 0, '2026-07-17 23:24:22'),
(28, 1, 'Entrenamiento completado', 'Camila Londoñez ha completado la rutina: hiit', 'routine_completed', 1, '2026-07-17 23:25:36'),
(29, 5, '¡Nuevo récord personal!', 'Superaste tu máximo en: Alternating Cable Shoulder Press, Bent Over Low-Pulley Side Lateral.', 'pr_achieved', 0, '2026-07-17 23:25:36'),
(30, 1, 'PR de alumno', 'Camila Londoñez logró 2 PR(s): Alternating Cable Shoulder Press, Bent Over Low-Pulley Side Lateral.', 'pr_achieved', 1, '2026-07-17 23:25:36'),
(31, 10, 'Nueva rutina asignada', 'Tu entrenador te asignó la rutina: Brazos', 'routine_assigned', 0, '2026-07-18 15:01:54'),
(32, 5, 'Nueva rutina asignada', 'Tu entrenador ha creado la rutina: Cardio', 'routine_assigned', 0, '2026-07-18 19:01:35'),
(33, 1, 'Entrenamiento completado', 'Camila Londoñez ha completado la rutina: Cardio', 'routine_completed', 1, '2026-07-18 19:02:51'),
(34, 5, '¡Nuevo récord personal!', 'Superaste tu máximo en: Crunch Lateral con Mancuerna.', 'pr_achieved', 0, '2026-07-18 19:02:51'),
(35, 1, 'PR de alumno', 'Camila Londoñez logró 1 PR(s): Crunch Lateral con Mancuerna.', 'pr_achieved', 1, '2026-07-18 19:02:51');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `nutrition_targets`
--

CREATE TABLE `nutrition_targets` (
  `id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `trainer_id` int(11) NOT NULL,
  `calories` int(11) NOT NULL,
  `protein_g` int(11) NOT NULL,
  `carbs_g` int(11) NOT NULL,
  `fats_g` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `nutrition_targets`
--

INSERT INTO `nutrition_targets` (`id`, `client_id`, `trainer_id`, `calories`, `protein_g`, `carbs_g`, `fats_g`, `created_at`, `updated_at`) VALUES
(1, 5, 1, 5000, 300, 500, 200, '2026-07-15 19:48:46', '2026-07-15 19:48:46');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `personal_records`
--

CREATE TABLE `personal_records` (
  `id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `exercise_id` int(11) DEFAULT NULL,
  `exercise_name` varchar(150) NOT NULL,
  `weight` decimal(6,2) NOT NULL,
  `reps` int(11) NOT NULL,
  `achieved_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `session_id` int(11) DEFAULT NULL,
  `set_log_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `personal_records`
--

INSERT INTO `personal_records` (`id`, `client_id`, `exercise_id`, `exercise_name`, `weight`, `reps`, `achieved_at`, `session_id`, `set_log_id`, `created_at`) VALUES
(1, 5, 77, 'Alternating Cable Shoulder Press', 30.00, 10, '2026-07-17 23:25:36', 15, 60, '2026-07-17 23:25:36'),
(2, 5, 78, 'Bent Over Low-Pulley Side Lateral', 80.00, 10, '2026-07-17 23:25:36', 15, 61, '2026-07-17 23:25:36'),
(3, 5, 81, 'Crunch Lateral con Mancuerna', 5.00, 10, '2026-07-18 19:02:51', 16, 66, '2026-07-18 19:02:51');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `progress_photos`
--

CREATE TABLE `progress_photos` (
  `id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `checkin_id` int(11) DEFAULT NULL,
  `image_url` varchar(512) NOT NULL,
  `pose_type` enum('front','side','back') NOT NULL,
  `taken_at` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `routine_templates`
--

CREATE TABLE `routine_templates` (
  `id` int(11) NOT NULL,
  `trainer_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `routine_templates`
--

INSERT INTO `routine_templates` (`id`, `trainer_id`, `name`, `notes`, `created_at`, `updated_at`) VALUES
(2, 1, 'Brazos', NULL, '2026-07-14 02:04:38', '2026-07-14 02:04:38'),
(3, 6, 'Pierna', NULL, '2026-07-14 02:08:57', '2026-07-14 02:08:57'),
(4, 1, 'general', NULL, '2026-07-14 02:13:26', '2026-07-14 02:13:26');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `rutinas`
--

CREATE TABLE `rutinas` (
  `id` int(11) NOT NULL,
  `alumno_id` int(11) NOT NULL,
  `dia_semana` enum('Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo') NOT NULL,
  `nombre_rutina` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `rutinas`
--

INSERT INTO `rutinas` (`id`, `alumno_id`, `dia_semana`, `nombre_rutina`) VALUES
(5, 4, 'Lunes', 'Pierna'),
(8, 9, 'Lunes', 'Pierna'),
(9, 5, 'Miércoles', 'general'),
(10, 4, 'Martes', 'Probe empty / null'),
(11, 5, 'Martes', 'pierna'),
(13, 5, 'Lunes', 'Sin media'),
(15, 5, 'Jueves', 'Empuje'),
(16, 5, 'Viernes', 'hiit'),
(17, 10, 'Lunes', 'Brazos'),
(18, 5, 'Sábado', 'Cardio');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `template_exercises`
--

CREATE TABLE `template_exercises` (
  `id` int(11) NOT NULL,
  `template_id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `exercise_id` int(11) DEFAULT NULL,
  `series` int(11) NOT NULL,
  `repeticiones` int(11) NOT NULL,
  `peso` decimal(6,2) NOT NULL,
  `rest_time_seconds` int(11) NOT NULL DEFAULT 90 COMMENT 'Descanso entre series (segundos)',
  `superset_letter` varchar(2) DEFAULT NULL COMMENT 'Grupo superserie/circuito (A, B) - Feature 029',
  `indicaciones` text DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `template_exercises`
--

INSERT INTO `template_exercises` (`id`, `template_id`, `nombre`, `exercise_id`, `series`, `repeticiones`, `peso`, `rest_time_seconds`, `superset_letter`, `indicaciones`, `sort_order`) VALUES
(3, 2, 'Elevaciones Laterales', NULL, 4, 10, 5.00, 90, NULL, 'subir bien los brazos', 0),
(4, 2, 'Press militar', NULL, 3, 10, 20.00, 90, NULL, 'SUBIR BIEN', 1),
(5, 3, 'sentadilla profunda', NULL, 3, 10, 50.00, 90, NULL, NULL, 0),
(6, 3, 'extension de cuadriceps', NULL, 3, 10, 80.00, 90, NULL, NULL, 1),
(7, 4, 'Ab Roller', NULL, 3, 10, 0.00, 90, NULL, 'Hold the Ab Roller with both hands and kneel on the floor.\nNow place the ab roller on the floor in front of you so that you are on all your hands and knees (as in a kneeling push up position). This will be your starting position.\nSlowly roll the ab roller straight forward, stretching your body into a straight position. Tip: Go down as far as you can without touching the floor with your body. Breathe in during this portion of the movement.\nAfter a pause at the stretched position, start pulling yourself back to the starting position as you breathe out. Tip: Go slowly and keep your abs tight at all times.', 0),
(8, 4, 'Advanced Kettlebell Windmill', NULL, 3, 10, 0.00, 90, NULL, 'Clean and press a kettlebell overhead with one arm.\nKeeping the kettlebell locked out at all times, push your butt out in the direction of the locked out kettlebell. Keep the non-working arm behind your back and turn your feet out at a forty-five degree angle from the arm with the kettlebell.\nLower yourself as far as possible.\nPause for a second and reverse the motion back to the starting position.', 1),
(9, 4, 'Air Bike', NULL, 3, 10, 0.00, 90, NULL, 'Lie flat on the floor with your lower back pressed to the ground. For this exercise, you will need to put your hands beside your head. Be careful however to not strain with the neck as you perform it. Now lift your shoulders into the crunch position.\nBring knees up to where they are perpendicular to the floor, with your lower legs parallel to the floor. This will be your starting position.\nNow simultaneously, slowly go through a cycle pedal motion kicking forward with the right leg and bringing in the knee of the left leg. Bring your right elbow close to your left knee by crunching to the side, as you breathe out.\nGo back to the initial position as you breathe in.\nCrunch to the opposite side as you cycle your legs and bring closer your left elbow to your right knee and exhale.\nContinue alternating in this manner until all of the recommended repetitions for each side have been completed.', 2);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `trainers_info`
--

CREATE TABLE `trainers_info` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `foto_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `saas_plan` enum('FREE','PRO') NOT NULL DEFAULT 'FREE',
  `saas_expiration_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `trainers_info`
--

INSERT INTO `trainers_info` (`id`, `user_id`, `telefono`, `foto_url`, `created_at`, `updated_at`, `saas_plan`, `saas_expiration_date`) VALUES
(1, 1, '3007236789', '/uploads/avatars/user_1.jpg', '2026-07-14 17:09:04', '2026-07-14 17:14:28', 'FREE', NULL),
(2, 6, NULL, NULL, '2026-07-16 18:48:23', '2026-07-16 18:49:04', 'FREE', '2026-07-16');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `rol` enum('trainer','client') NOT NULL DEFAULT 'client',
  `trainer_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_superadmin` tinyint(1) NOT NULL DEFAULT 0,
  `email` varchar(255) DEFAULT NULL COMMENT 'Correo para recuperación de contraseña (Feature 056)',
  `reset_password_token` varchar(64) DEFAULT NULL COMMENT 'SHA-256 hex del token de reset (Feature 056)',
  `reset_password_expires` datetime DEFAULT NULL COMMENT 'Expiración del token de reset (Feature 056)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `username`, `password`, `nombre`, `rol`, `trainer_id`, `created_at`, `is_superadmin`, `email`, `reset_password_token`, `reset_password_expires`) VALUES
(1, 'jhon', '$2b$10$hrOId9bGy6YNsHsTbrJ3YOJa0d73GuTJ/ohlwMoLbEYVwfgvD1tYm', 'Jhon Fuentes', 'trainer', NULL, '2026-07-10 20:13:22', 1, 'jhonf17@gmail.com', '4ad64ec0fdd531692e182efb9e76a14673acb8f8b8a85d2b2df2d94c7d0487bc', '2026-07-19 20:41:47'),
(4, 'Lucas123', '$2b$10$q9MJWPn0Lia7jqZk8zH94.Om6CpgvR5bLjf6yJtkHYwFy1QEY55xa', 'Lucas Jaramillo', 'client', 1, '2026-07-11 22:10:26', 0, NULL, NULL, NULL),
(5, 'Camila123', '$2b$10$1U5o45pJQZTNwqOwG24ygO.a95VMGERcDJgrSjQBWiE6EQaSMVEg6', 'Camila Londoñez', 'client', 1, '2026-07-11 23:12:34', 0, NULL, NULL, NULL),
(6, 'Tiago123', '$2b$10$eLl8sDuY2tKgNRXDH.ar6ufIcG.uSLsd9bHKAKhqTnIrS2SF9tjle', 'Tiago Jaramillo', 'trainer', NULL, '2026-07-11 23:21:50', 0, 'jhon.fuentesjt@est.iudigital.edu.co', 'ece4d2a85782d925d3a61b626ecd672f8d249d6e083872f0574148c236377cf2', '2026-07-19 20:08:56'),
(8, 'Daniela123', '$2b$10$sMH7fL9p4jQGbc8EUPkz9uQYO6zngTpqXqQTtQ3UssBheOSfd182i', 'Daniela Perez', 'client', 6, '2026-07-11 23:32:55', 0, NULL, NULL, NULL),
(9, 'Chavo8', '$2b$10$Ztyyb6RDdh6sBYk.cUg9EeiZll3Rz2qDlxZp805apqFQWEfQAhpnW', 'Chavo del ocho', 'client', 6, '2026-07-12 02:31:34', 0, NULL, NULL, NULL),
(10, 'smoke_cli_1784059258964', '$2b$10$Celi3C212qAqyZK.//byye7OrSnLwtfSFvx1egmX8HwSd1W2hCuye', 'Smoke Client', 'client', 1, '2026-07-14 20:00:59', 0, NULL, NULL, NULL),
(11, 'Dayana123', '$2b$10$22/plDnAtOVvpwe.vz9RzujUeWp9DXW0JNJEdfMz0IfFSrJw8h.te', 'Dayana', 'client', 6, '2026-07-16 18:51:42', 0, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `weekly_checkins`
--

CREATE TABLE `weekly_checkins` (
  `id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `created_at` date NOT NULL,
  `sleep_quality` tinyint(4) NOT NULL,
  `stress_level` tinyint(4) NOT NULL,
  `diet_adherence` tinyint(4) NOT NULL,
  `notes` text DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL
) ;

--
-- Volcado de datos para la tabla `weekly_checkins`
--

INSERT INTO `weekly_checkins` (`id`, `client_id`, `created_at`, `sleep_quality`, `stress_level`, `diet_adherence`, `notes`, `reviewed_at`) VALUES
(2, 5, '2026-07-15', 3, 4, 4, NULL, '2026-07-19 20:34:13');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `workout_sessions`
--

CREATE TABLE `workout_sessions` (
  `id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `routine_id` int(11) DEFAULT NULL,
  `routine_name` varchar(100) NOT NULL,
  `started_at` datetime DEFAULT NULL,
  `finished_at` datetime NOT NULL DEFAULT current_timestamp(),
  `status` enum('completed','abandoned') NOT NULL DEFAULT 'completed',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `workout_sessions`
--

INSERT INTO `workout_sessions` (`id`, `client_id`, `routine_id`, `routine_name`, `started_at`, `finished_at`, `status`, `created_at`) VALUES
(1, 4, NULL, 'Pierna', '2026-07-13 15:46:52', '2026-07-13 15:47:22', 'completed', '2026-07-13 20:47:22'),
(2, 4, 5, 'Pierna', '2026-07-13 18:31:51', '2026-07-13 18:32:13', 'completed', '2026-07-13 23:32:13'),
(3, 5, 9, 'general', '2026-07-13 21:15:59', '2026-07-13 21:18:52', 'completed', '2026-07-14 02:18:52'),
(4, 5, 9, 'general', '2026-07-13 21:21:48', '2026-07-13 21:22:57', 'completed', '2026-07-14 02:22:57'),
(5, 4, 10, 'brazos', '2026-07-14 11:12:04', '2026-07-14 11:12:24', 'completed', '2026-07-14 16:12:24'),
(6, 5, 11, 'pierna', '2026-07-14 21:04:44', '2026-07-14 21:04:56', 'completed', '2026-07-15 02:04:56'),
(7, 5, 11, 'pierna', '2026-07-14 21:17:14', '2026-07-14 21:17:17', 'completed', '2026-07-15 02:17:17'),
(8, 5, 9, 'general', '2026-07-15 11:31:59', '2026-07-15 11:33:45', 'completed', '2026-07-15 16:33:45'),
(9, 5, 9, 'general', '2026-07-15 11:42:59', '2026-07-15 11:44:45', 'completed', '2026-07-15 16:44:45'),
(10, 5, 9, 'general', '2026-07-15 13:30:31', '2026-07-15 13:31:11', 'completed', '2026-07-15 18:31:11'),
(11, 5, 9, 'general', '2026-07-15 13:52:13', '2026-07-15 13:53:15', 'completed', '2026-07-15 18:53:15'),
(12, 5, 9, 'general', '2026-07-15 14:07:40', '2026-07-15 14:08:24', 'completed', '2026-07-15 19:08:24'),
(13, 5, 15, 'Empuje', '2026-07-16 17:53:57', '2026-07-16 17:54:10', 'completed', '2026-07-16 22:54:10'),
(14, 5, 15, 'Empuje', '2026-07-16 18:04:24', '2026-07-16 18:05:07', 'completed', '2026-07-16 23:05:07'),
(15, 5, 16, 'hiit', '2026-07-17 18:25:07', '2026-07-17 18:25:36', 'completed', '2026-07-17 23:25:36'),
(16, 5, 18, 'Cardio', '2026-07-18 14:01:56', '2026-07-18 14:02:51', 'completed', '2026-07-18 19:02:51');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `workout_set_logs`
--

CREATE TABLE `workout_set_logs` (
  `id` int(11) NOT NULL,
  `session_id` int(11) NOT NULL,
  `exercise_id` int(11) DEFAULT NULL,
  `exercise_name` varchar(150) NOT NULL,
  `set_number` int(11) NOT NULL,
  `weight` decimal(6,2) NOT NULL,
  `reps` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `workout_set_logs`
--

INSERT INTO `workout_set_logs` (`id`, `session_id`, `exercise_id`, `exercise_name`, `set_number`, `weight`, `reps`, `created_at`) VALUES
(1, 1, NULL, 'Sentadilla profunda', 1, 20.00, 10, '2026-07-13 20:47:22'),
(2, 1, NULL, 'Sentadilla profunda', 2, 20.00, 8, '2026-07-13 20:47:22'),
(3, 1, NULL, 'Sentadilla profunda', 3, 10.00, 10, '2026-07-13 20:47:22'),
(4, 1, NULL, 'Extension de cuadriceps', 1, 80.00, 10, '2026-07-13 20:47:22'),
(5, 1, NULL, 'Extension de cuadriceps', 2, 80.00, 10, '2026-07-13 20:47:22'),
(6, 1, NULL, 'Extension de cuadriceps', 3, 80.00, 10, '2026-07-13 20:47:22'),
(7, 1, NULL, 'Extension de cuadriceps', 4, 80.00, 10, '2026-07-13 20:47:22'),
(8, 1, NULL, 'Prensa inclinada', 1, 50.00, 10, '2026-07-13 20:47:22'),
(9, 1, NULL, 'Prensa inclinada', 2, 52.00, 10, '2026-07-13 20:47:22'),
(10, 1, NULL, 'Prensa inclinada', 3, 50.00, 10, '2026-07-13 20:47:22'),
(11, 2, NULL, 'Battling Ropes', 1, 52.00, 10, '2026-07-13 23:32:13'),
(12, 2, NULL, 'Battling Ropes', 2, 52.00, 10, '2026-07-13 23:32:13'),
(13, 2, NULL, 'Battling Ropes', 3, 52.00, 10, '2026-07-13 23:32:13'),
(14, 3, NULL, 'Ab Roller', 1, 0.00, 10, '2026-07-14 02:18:52'),
(15, 3, NULL, 'Ab Roller', 2, 0.00, 10, '2026-07-14 02:18:52'),
(16, 3, NULL, 'Ab Roller', 3, 0.00, 10, '2026-07-14 02:18:52'),
(17, 3, NULL, 'Advanced Kettlebell Windmill', 1, 0.00, 10, '2026-07-14 02:18:52'),
(18, 3, NULL, 'Advanced Kettlebell Windmill', 2, 0.00, 10, '2026-07-14 02:18:52'),
(19, 3, NULL, 'Advanced Kettlebell Windmill', 3, 0.00, 10, '2026-07-14 02:18:52'),
(20, 3, NULL, 'Air Bike', 1, 0.00, 10, '2026-07-14 02:18:52'),
(21, 3, NULL, 'Air Bike', 2, 0.00, 10, '2026-07-14 02:18:52'),
(22, 3, NULL, 'Air Bike', 3, 0.00, 10, '2026-07-14 02:18:52'),
(23, 4, NULL, 'Ab Roller', 1, 0.00, 10, '2026-07-14 02:22:57'),
(24, 4, NULL, 'Ab Roller', 2, 0.00, 10, '2026-07-14 02:22:57'),
(25, 4, NULL, 'Ab Roller', 3, 0.00, 10, '2026-07-14 02:22:57'),
(26, 4, NULL, 'Advanced Kettlebell Windmill', 1, 0.00, 10, '2026-07-14 02:22:57'),
(27, 4, NULL, 'Advanced Kettlebell Windmill', 2, 0.00, 10, '2026-07-14 02:22:57'),
(28, 4, NULL, 'Advanced Kettlebell Windmill', 3, 0.00, 10, '2026-07-14 02:22:57'),
(29, 4, NULL, 'Air Bike', 1, 0.00, 10, '2026-07-14 02:22:57'),
(30, 4, NULL, 'Air Bike', 2, 0.00, 10, '2026-07-14 02:22:57'),
(31, 4, NULL, 'Air Bike', 3, 0.00, 10, '2026-07-14 02:22:57'),
(32, 5, NULL, 'Barbell Curls Lying Against An Incline', 1, 23.00, 10, '2026-07-14 16:12:24'),
(33, 5, NULL, 'Barbell Curls Lying Against An Incline', 2, 23.00, 10, '2026-07-14 16:12:24'),
(34, 5, NULL, 'Barbell Curls Lying Against An Incline', 3, 43.00, 10, '2026-07-14 16:12:24'),
(35, 6, NULL, '90/90 Hamstring', 1, 20.00, 10, '2026-07-15 02:04:56'),
(36, 6, NULL, '90/90 Hamstring', 2, 20.00, 10, '2026-07-15 02:04:56'),
(37, 6, NULL, '90/90 Hamstring', 3, 20.00, 10, '2026-07-15 02:04:56'),
(38, 6, NULL, '90/90 Hamstring', 4, 20.00, 10, '2026-07-15 02:04:56'),
(39, 7, 32, 'Backward Drag', 1, 20.00, 10, '2026-07-15 02:17:17'),
(40, 8, NULL, 'Ab Roller', 1, 15.00, 10, '2026-07-15 16:33:45'),
(41, 8, NULL, 'Ab Roller', 2, 15.00, 10, '2026-07-15 16:33:45'),
(42, 9, NULL, 'Ab Roller', 1, 15.00, 10, '2026-07-15 16:44:45'),
(43, 9, NULL, 'Ab Roller', 2, 15.00, 10, '2026-07-15 16:44:45'),
(44, 10, NULL, 'Board Press', 1, 15.00, 10, '2026-07-15 18:31:11'),
(45, 10, NULL, 'Board Press', 2, 15.00, 10, '2026-07-15 18:31:11'),
(46, 11, NULL, 'Board Press', 1, 22.00, 10, '2026-07-15 18:53:15'),
(47, 11, NULL, 'Board Press', 2, 15.00, 10, '2026-07-15 18:53:15'),
(48, 11, NULL, 'Bench Sprint', 1, 0.00, 10, '2026-07-15 18:53:15'),
(49, 11, NULL, 'Bench Sprint', 2, 0.00, 10, '2026-07-15 18:53:15'),
(50, 11, NULL, 'Adductor/Groin', 1, 23.00, 10, '2026-07-15 18:53:15'),
(51, 12, 73, 'Board Press', 1, 15.00, 10, '2026-07-15 19:08:24'),
(52, 12, 74, 'Bench Sprint', 1, 0.00, 10, '2026-07-15 19:08:24'),
(53, 12, 73, 'Board Press', 2, 15.00, 10, '2026-07-15 19:08:24'),
(54, 12, 74, 'Bench Sprint', 2, 0.00, 10, '2026-07-15 19:08:24'),
(55, 12, 75, 'Adductor/Groin', 1, 23.00, 10, '2026-07-15 19:08:24'),
(56, 13, 76, 'Bench Jump', 1, 0.00, 10, '2026-07-16 22:54:10'),
(57, 13, 76, 'Bench Jump', 2, 0.00, 10, '2026-07-16 22:54:10'),
(58, 14, 76, 'Bench Jump', 1, 0.00, 10, '2026-07-16 23:05:07'),
(59, 14, 76, 'Bench Jump', 2, 0.00, 10, '2026-07-16 23:05:07'),
(60, 15, 77, 'Alternating Cable Shoulder Press', 1, 30.00, 10, '2026-07-17 23:25:36'),
(61, 15, 78, 'Bent Over Low-Pulley Side Lateral', 1, 80.00, 10, '2026-07-17 23:25:36'),
(62, 15, 77, 'Alternating Cable Shoulder Press', 2, 30.00, 10, '2026-07-17 23:25:36'),
(63, 15, 78, 'Bent Over Low-Pulley Side Lateral', 2, 80.00, 10, '2026-07-17 23:25:36'),
(64, 15, 77, 'Alternating Cable Shoulder Press', 3, 30.00, 10, '2026-07-17 23:25:36'),
(65, 15, 78, 'Bent Over Low-Pulley Side Lateral', 3, 80.00, 10, '2026-07-17 23:25:36'),
(66, 16, 81, 'Crunch Lateral con Mancuerna', 1, 5.00, 10, '2026-07-18 19:02:51'),
(67, 16, 82, 'Crunch Inferior con Rodillas Flexionadas', 1, 0.00, 10, '2026-07-18 19:02:51'),
(68, 16, 81, 'Crunch Lateral con Mancuerna', 2, 5.00, 10, '2026-07-18 19:02:51'),
(69, 16, 82, 'Crunch Inferior con Rodillas Flexionadas', 2, 0.00, 10, '2026-07-18 19:02:51'),
(70, 16, 81, 'Crunch Lateral con Mancuerna', 3, 5.00, 10, '2026-07-18 19:02:51'),
(71, 16, 82, 'Crunch Inferior con Rodillas Flexionadas', 3, 0.00, 10, '2026-07-18 19:02:51');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `alumnos_info`
--
ALTER TABLE `alumnos_info`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indices de la tabla `body_composition_logs`
--
ALTER TABLE `body_composition_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_bcl_client_measured` (`client_id`,`measured_at`),
  ADD KEY `fk_bcl_recorder` (`recorded_by`);

--
-- Indices de la tabla `client_memberships`
--
ALTER TABLE `client_memberships`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_client_memberships_client` (`client_id`),
  ADD KEY `idx_client_memberships_status` (`status`),
  ADD KEY `idx_client_memberships_period_end` (`period_end`),
  ADD KEY `fk_client_memberships_updated_by` (`updated_by`);

--
-- Indices de la tabla `client_streaks`
--
ALTER TABLE `client_streaks`
  ADD PRIMARY KEY (`client_id`);

--
-- Indices de la tabla `diet_items`
--
ALTER TABLE `diet_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_diet_items_meal` (`diet_meal_id`);

--
-- Indices de la tabla `diet_meals`
--
ALTER TABLE `diet_meals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_diet_meals_plan` (`diet_plan_id`);

--
-- Indices de la tabla `diet_plans`
--
ALTER TABLE `diet_plans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_diet_plans_trainer` (`trainer_id`),
  ADD KEY `idx_diet_plans_client` (`client_id`),
  ADD KEY `idx_diet_plans_client_active` (`client_id`,`is_active`);

--
-- Indices de la tabla `ejercicios`
--
ALTER TABLE `ejercicios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `rutina_id` (`rutina_id`),
  ADD KEY `idx_ejercicios_exercise` (`exercise_id`);

--
-- Indices de la tabla `exercises`
--
ALTER TABLE `exercises`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_exercises_name` (`name`),
  ADD KEY `idx_exercises_trainer` (`created_by_trainer_id`);

--
-- Indices de la tabla `habits`
--
ALTER TABLE `habits`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_habits_client` (`client_id`),
  ADD KEY `idx_habits_trainer` (`trainer_id`);

--
-- Indices de la tabla `habit_logs`
--
ALTER TABLE `habit_logs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_habit_logs_habit_date` (`habit_id`,`logged_date`),
  ADD KEY `idx_habit_logs_date` (`logged_date`);

--
-- Indices de la tabla `invitaciones`
--
ALTER TABLE `invitaciones`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `fk_invitaciones_trainer` (`trainer_id`);

--
-- Indices de la tabla `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_messages_sender` (`sender_id`),
  ADD KEY `idx_messages_receiver` (`receiver_id`),
  ADD KEY `idx_messages_pair_created` (`sender_id`,`receiver_id`,`created_at`);

--
-- Indices de la tabla `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notifications_user` (`user_id`),
  ADD KEY `idx_notifications_unread` (`user_id`,`is_read`);

--
-- Indices de la tabla `nutrition_targets`
--
ALTER TABLE `nutrition_targets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_nutrition_targets_client` (`client_id`),
  ADD KEY `idx_nutrition_targets_trainer` (`trainer_id`);

--
-- Indices de la tabla `personal_records`
--
ALTER TABLE `personal_records`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_personal_records_client_name` (`client_id`,`exercise_name`),
  ADD KEY `idx_personal_records_client_exercise` (`client_id`,`exercise_id`),
  ADD KEY `idx_personal_records_achieved` (`client_id`,`achieved_at`),
  ADD KEY `fk_personal_records_session` (`session_id`),
  ADD KEY `fk_personal_records_set_log` (`set_log_id`);

--
-- Indices de la tabla `progress_photos`
--
ALTER TABLE `progress_photos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_progress_photos_client` (`client_id`),
  ADD KEY `idx_progress_photos_checkin` (`checkin_id`),
  ADD KEY `idx_progress_photos_pose` (`pose_type`);

--
-- Indices de la tabla `routine_templates`
--
ALTER TABLE `routine_templates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_routine_templates_trainer` (`trainer_id`);

--
-- Indices de la tabla `rutinas`
--
ALTER TABLE `rutinas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `alumno_id` (`alumno_id`);

--
-- Indices de la tabla `template_exercises`
--
ALTER TABLE `template_exercises`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_template_exercises_template` (`template_id`),
  ADD KEY `idx_template_exercises_exercise` (`exercise_id`);

--
-- Indices de la tabla `trainers_info`
--
ALTER TABLE `trainers_info`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_trainers_info_user` (`user_id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `fk_usuarios_trainer` (`trainer_id`);

--
-- Indices de la tabla `weekly_checkins`
--
ALTER TABLE `weekly_checkins`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_weekly_checkins_client` (`client_id`),
  ADD KEY `idx_weekly_checkins_created` (`created_at`),
  ADD KEY `idx_weekly_checkins_reviewed` (`reviewed_at`);

--
-- Indices de la tabla `workout_sessions`
--
ALTER TABLE `workout_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_workout_sessions_client` (`client_id`),
  ADD KEY `idx_workout_sessions_finished` (`finished_at`),
  ADD KEY `fk_workout_sessions_routine` (`routine_id`);

--
-- Indices de la tabla `workout_set_logs`
--
ALTER TABLE `workout_set_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_workout_set_logs_session` (`session_id`),
  ADD KEY `fk_workout_set_logs_exercise` (`exercise_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `alumnos_info`
--
ALTER TABLE `alumnos_info`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `body_composition_logs`
--
ALTER TABLE `body_composition_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `client_memberships`
--
ALTER TABLE `client_memberships`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT de la tabla `diet_items`
--
ALTER TABLE `diet_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `diet_meals`
--
ALTER TABLE `diet_meals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `diet_plans`
--
ALTER TABLE `diet_plans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `ejercicios`
--
ALTER TABLE `ejercicios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=83;

--
-- AUTO_INCREMENT de la tabla `exercises`
--
ALTER TABLE `exercises`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1499;

--
-- AUTO_INCREMENT de la tabla `habits`
--
ALTER TABLE `habits`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `habit_logs`
--
ALTER TABLE `habit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `invitaciones`
--
ALTER TABLE `invitaciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT de la tabla `nutrition_targets`
--
ALTER TABLE `nutrition_targets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `personal_records`
--
ALTER TABLE `personal_records`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `progress_photos`
--
ALTER TABLE `progress_photos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `routine_templates`
--
ALTER TABLE `routine_templates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `rutinas`
--
ALTER TABLE `rutinas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT de la tabla `template_exercises`
--
ALTER TABLE `template_exercises`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `trainers_info`
--
ALTER TABLE `trainers_info`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de la tabla `weekly_checkins`
--
ALTER TABLE `weekly_checkins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `workout_sessions`
--
ALTER TABLE `workout_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT de la tabla `workout_set_logs`
--
ALTER TABLE `workout_set_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=72;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `alumnos_info`
--
ALTER TABLE `alumnos_info`
  ADD CONSTRAINT `alumnos_info_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `body_composition_logs`
--
ALTER TABLE `body_composition_logs`
  ADD CONSTRAINT `fk_bcl_client` FOREIGN KEY (`client_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_bcl_recorder` FOREIGN KEY (`recorded_by`) REFERENCES `usuarios` (`id`);

--
-- Filtros para la tabla `client_memberships`
--
ALTER TABLE `client_memberships`
  ADD CONSTRAINT `fk_client_memberships_client` FOREIGN KEY (`client_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_client_memberships_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `client_streaks`
--
ALTER TABLE `client_streaks`
  ADD CONSTRAINT `fk_client_streaks_client` FOREIGN KEY (`client_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `diet_items`
--
ALTER TABLE `diet_items`
  ADD CONSTRAINT `fk_diet_items_meal` FOREIGN KEY (`diet_meal_id`) REFERENCES `diet_meals` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `diet_meals`
--
ALTER TABLE `diet_meals`
  ADD CONSTRAINT `fk_diet_meals_plan` FOREIGN KEY (`diet_plan_id`) REFERENCES `diet_plans` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `diet_plans`
--
ALTER TABLE `diet_plans`
  ADD CONSTRAINT `fk_diet_plans_client` FOREIGN KEY (`client_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_diet_plans_trainer` FOREIGN KEY (`trainer_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `ejercicios`
--
ALTER TABLE `ejercicios`
  ADD CONSTRAINT `ejercicios_ibfk_1` FOREIGN KEY (`rutina_id`) REFERENCES `rutinas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ejercicios_catalog_exercise` FOREIGN KEY (`exercise_id`) REFERENCES `exercises` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `exercises`
--
ALTER TABLE `exercises`
  ADD CONSTRAINT `fk_exercises_trainer` FOREIGN KEY (`created_by_trainer_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `habits`
--
ALTER TABLE `habits`
  ADD CONSTRAINT `fk_habits_client` FOREIGN KEY (`client_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_habits_trainer` FOREIGN KEY (`trainer_id`) REFERENCES `usuarios` (`id`);

--
-- Filtros para la tabla `habit_logs`
--
ALTER TABLE `habit_logs`
  ADD CONSTRAINT `fk_habit_logs_habit` FOREIGN KEY (`habit_id`) REFERENCES `habits` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `invitaciones`
--
ALTER TABLE `invitaciones`
  ADD CONSTRAINT `fk_invitaciones_trainer` FOREIGN KEY (`trainer_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `fk_messages_receiver` FOREIGN KEY (`receiver_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_messages_sender` FOREIGN KEY (`sender_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `nutrition_targets`
--
ALTER TABLE `nutrition_targets`
  ADD CONSTRAINT `fk_nutrition_targets_client` FOREIGN KEY (`client_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_nutrition_targets_trainer` FOREIGN KEY (`trainer_id`) REFERENCES `usuarios` (`id`);

--
-- Filtros para la tabla `personal_records`
--
ALTER TABLE `personal_records`
  ADD CONSTRAINT `fk_personal_records_client` FOREIGN KEY (`client_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_personal_records_session` FOREIGN KEY (`session_id`) REFERENCES `workout_sessions` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_personal_records_set_log` FOREIGN KEY (`set_log_id`) REFERENCES `workout_set_logs` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `progress_photos`
--
ALTER TABLE `progress_photos`
  ADD CONSTRAINT `fk_progress_photos_checkin` FOREIGN KEY (`checkin_id`) REFERENCES `weekly_checkins` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_progress_photos_client` FOREIGN KEY (`client_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `routine_templates`
--
ALTER TABLE `routine_templates`
  ADD CONSTRAINT `fk_routine_templates_trainer` FOREIGN KEY (`trainer_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `rutinas`
--
ALTER TABLE `rutinas`
  ADD CONSTRAINT `rutinas_ibfk_1` FOREIGN KEY (`alumno_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `template_exercises`
--
ALTER TABLE `template_exercises`
  ADD CONSTRAINT `fk_template_exercises_catalog_exercise` FOREIGN KEY (`exercise_id`) REFERENCES `exercises` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_template_exercises_template` FOREIGN KEY (`template_id`) REFERENCES `routine_templates` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `trainers_info`
--
ALTER TABLE `trainers_info`
  ADD CONSTRAINT `fk_trainers_info_user` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `fk_usuarios_trainer` FOREIGN KEY (`trainer_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `weekly_checkins`
--
ALTER TABLE `weekly_checkins`
  ADD CONSTRAINT `fk_weekly_checkins_client` FOREIGN KEY (`client_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `workout_sessions`
--
ALTER TABLE `workout_sessions`
  ADD CONSTRAINT `fk_workout_sessions_client` FOREIGN KEY (`client_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_workout_sessions_routine` FOREIGN KEY (`routine_id`) REFERENCES `rutinas` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `workout_set_logs`
--
ALTER TABLE `workout_set_logs`
  ADD CONSTRAINT `fk_workout_set_logs_exercise` FOREIGN KEY (`exercise_id`) REFERENCES `ejercicios` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_workout_set_logs_session` FOREIGN KEY (`session_id`) REFERENCES `workout_sessions` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
