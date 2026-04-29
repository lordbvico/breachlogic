# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2026-04-29

### Added
- **Capacitor Mobile Support**: Initial integration for Android and iOS platforms, allowing BreachLogic to run as a native mobile application.
- **Mobile-Responsive UI**: Optimized the `PuzzleCanvas` and overall user interface for a seamless experience on smaller screens.
- **Puzzle Approval Workflow**: Introduced a new system for submitting and approving puzzles to streamline content creation.
- **Admin Puzzle Management**: Added administrative tools for managing the puzzle library and daily puzzle selections.
- **Personalized Daily Puzzles**: Users now receive personalized daily puzzle challenges.
- **Notification System**: Added a notification bell and submission flow for better user engagement.
- **Capacitor Integration**: Integrated `@capacitor/android` and `@capacitor/ios`.

### Fixed
- **Mobile Configuration**: Fixed configuration issues and added missing generated files for Android and iOS.
- **Gradle & AGP Upgrade**: Upgraded Gradle and Android Gradle Plugin (AGP 9.x) for better performance and compatibility.
- **Windows Compatibility**: Fixed Gradle `-classpath` errors specifically occurring on Windows environments.
- **Vercel Deployment**: Upgraded ESLint to version 9 and added `.npmrc` to resolve deployment issues on Vercel.
- **AGP Compatibility**: Resolved issues with ProGuard files and deprecated properties in AGP 9.x.

### Changed
- **Dependencies**: Upgraded Next.js to `^16.2.4`, React to `^18.3.1`, and integrated `@xyflow/react` (React Flow v12).
- **Gradle Toolchain**: Added the Foojay resolver to handle Java toolchains automatically.
