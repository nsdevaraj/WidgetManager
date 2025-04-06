## Code Signing and Auto-Updates

### Setting Up Code Signing

#### macOS
1. Get a Developer ID certificate from Apple Developer account
2. Export the certificate as a .p12 file
3. Set the following environment variables:
   ```
   APPLE_ID=your.apple.id@example.com
   APPLE_ID_PASSWORD=your-app-specific-password
   APPLE_TEAM_ID=your-team-id
   CSC_LINK=path/to/certificate.p12
   CSC_KEY_PASSWORD=your-certificate-password
   ```

#### Windows
1. Obtain a code signing certificate from a Certificate Authority
2. Set the following environment variables:
   ```
   WINDOWS_CERTIFICATE_FILE=path/to/windows-cert.pfx
   WINDOWS_CERTIFICATE_PASSWORD=your-windows-cert-password
   ```

### Auto-Updates

The application uses GitHub releases for auto-updates. To set up:

1. Create a GitHub repository for your application
2. Generate a GitHub personal access token with `repo` scope
3. Set the following environment variables:
   ```
   GH_TOKEN=your-github-token
   GITHUB_OWNER=your-github-username
   GITHUB_REPO=URLWidgets
   ```

### Publishing Updates

1. Create a new version:
   ```bash
   npm version patch|minor|major
   ```

2. Build and publish:
   ```bash
   npm run publish
   ```
   This will:
   - Build the application for all platforms
   - Code sign the packages
   - Create a GitHub release
   - Upload the artifacts

3. Auto-updates will be available to users when they:
   - Start the application
   - Manually check for updates
   - Receive the hourly update check

### Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in all required values in `.env`

3. For development, set:
   ```
   NODE_ENV=development
   DEBUG=electron-builder
   ```

4. For production, set:
   ```
   NODE_ENV=production
   ```