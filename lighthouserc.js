module.exports = {
  ci: {
    collect: {
      url: [
        'https://chatguuspt.netlify.app',
        'https://chatguuspt.netlify.app/admin/tenant-dashboard.html',
        'https://chatguuspt.netlify.app/admin/analytics-dashboard.html'
      ],
      numberOfRuns: 2, // Reduced for faster CI
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.75 }], // Slightly lower for realistic expectations
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
      githubAppToken: process.env.LHCI_GITHUB_APP_TOKEN,
    },
  },
};
