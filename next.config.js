/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

// /** @type {import("next").NextConfig} */
// const config = {};

/** @type {import("next").NextConfig} */
    const config = {
      // --- ADD THIS 'images' BLOCK ---
      images: {
        remotePatterns: [
          {
            protocol: 'https',
            hostname: 'avatars.githubusercontent.com',
            port: '',
            pathname: '/**',
          },
        ],
      },
    };

    // export default config;

export default config;
