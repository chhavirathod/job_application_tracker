# Job Application Tracker - Chrome Extension

A privacy-first Chrome extension that helps freshers and early-career professionals track job applications effortlessly.

## 🎯 Features

- **Smart Job Detection**: Automatically detects job listing pages and pre-fills company and role details
- **One-Click Tracking**: Save job applications with a single click
- **Status Management**: Track application progress (Applied, Interview, Rejected, Ghosted)
- **Clean Dashboard**: View and manage all applications in a beautiful table interface
- **Privacy-First**: All data stored locally - no accounts, no cloud sync, no tracking
- **Fast & Lightweight**: Minimal footprint, maximum performance

## 📦 Installation

### For Development

1. **Clone or download this repository**

2. **Open Chrome and navigate to**:
   ```
   chrome://extensions/
   ```

3. **Enable Developer Mode** (toggle in top-right corner)

4. **Click "Load unpacked"** and select the `job-tracker-extension` folder

5. **The extension is now installed!** You'll see the icon in your toolbar.

### Creating Icons

Before loading the extension, you need to create icon files. Use any tool to create three PNG files:
- `assets/icons/icon16.png` (16x16 pixels)
- `assets/icons/icon48.png` (48x48 pixels)
- `assets/icons/icon128.png` (128x128 pixels)

Or use an online icon generator and save them in the `assets/icons/` directory.

## 🚀 Usage

### Tracking a Job Application

1. **Navigate to a job listing** (LinkedIn, Indeed, company career pages, etc.)

2. **Click the extension icon** in your toolbar

3. **Review pre-filled details** - the extension will auto-detect:
   - Company name
   - Job role/title
   - Job URL

4. **Add optional details**:
   - Resume version used
   - Application status

5. **Click "Track This Job"** - Done! ✅

### Manual Entry

If you're not on a job page, or detection didn't work:

1. Click the extension icon
2. Click **"Add Manually"**
3. Fill in the details manually
4. Click **"Add Application"**

### Managing Applications

1. **Open Dashboard**: Click the grid icon in the popup, or right-click anywhere and select "Open Job Tracker Dashboard"

2. **View Statistics**: See at a glance how many applications you've sent, interviews scheduled, etc.

3. **Filter & Search**:
   - Filter by status (Applied, Interview, Rejected, Ghosted)
   - Search by company or role name

4. **Edit Applications**:
   - Click the edit icon (pencil) to update details
   - Change status, add notes, update resume version

5. **Delete Applications**:
   - Click the delete icon (trash) to remove an application

## 📊 Dashboard Features

- **Real-time Statistics**: Total applications, interviews, rejections, ghosted
- **Status Filtering**: View applications by status
- **Smart Search**: Find applications by company or role
- **Quick Actions**: Edit, delete, or open job URLs directly
- **Beautiful UI**: Clean, modern design that's easy on the eyes

## 🔒 Privacy & Security

- **100% Local Storage**: All data stays on your device
- **No Accounts Required**: No sign-up, no login
- **No Tracking**: We don't collect any data about you
- **No Cloud Sync**: Your data never leaves your browser
- **Open Source**: Code is fully transparent and auditable

## 🛠️ Technical Details

### Tech Stack

- **Vanilla JavaScript** (ES6+)
- **Chrome Extension Manifest V3**
- **Chrome Storage API** for local persistence
- **Content Scripts** for page detection
- **Service Worker** for background tasks

### File Structure

```
job-tracker-extension/
├── manifest.json              # Extension configuration
├── popup/
│   ├── popup.html            # Extension popup UI
│   ├── popup.css             # Popup styles
│   └── popup.js              # Popup logic
├── dashboard/
│   ├── dashboard.html        # Dashboard UI
│   ├── dashboard.css         # Dashboard styles
│   └── dashboard.js          # Dashboard logic
├── content/
│   └── detectJob.js          # Job page detection
├── background/
│   └── background.js         # Background service worker
├── utils/
│   ├── storage.js            # Storage utilities
│   ├── extractors.js         # Data extraction logic
│   └── constants.js          # App constants
└── assets/
    └── icons/                # Extension icons
```

### Supported Job Portals

The extension works best on:
- LinkedIn Jobs
- Indeed
- Glassdoor
- Naukri
- Instahyre
- AngelList
- Company career pages (most standard sites)

## 🐛 Troubleshooting

### Job not detected?

- Use the **"Add Manually"** option
- Some job sites have unique structures that may not be detected
- You can still track everything manually with full functionality

### Data not showing?

- Check if you're on the same Chrome profile
- Data is stored per Chrome profile
- Try opening the dashboard from the extension popup

### Extension not working?

- Make sure you've loaded the extension in Developer Mode
- Check the browser console for errors (F12)
- Try reloading the extension from `chrome://extensions/`

## 🎨 Customization

Want to customize the extension? Here's what you can modify:

- **Colors**: Edit CSS files in `popup/` and `dashboard/`
- **Status Options**: Modify `utils/constants.js`
- **Detection Logic**: Update `content/detectJob.js` and `utils/extractors.js`

## 🚧 Future Enhancements

Potential features for future versions:
- Export applications to CSV
- Application reminders and follow-ups
- Resume version analytics
- Cloud backup (optional)
- Browser sync across devices
- Chrome notifications for updates

## 📝 License

MIT License - feel free to use, modify, and distribute!

## 🤝 Contributing

Found a bug? Have a feature request? 
- Open an issue on GitHub
- Submit a pull request
- Share your feedback!

## 💡 Tips for Job Seekers

1. **Track everything**: Even rejections help you see your progress
2. **Use resume versions**: Know which resume works best
3. **Add notes**: Record interview dates, contacts, or follow-up tasks
4. **Review regularly**: Check your dashboard weekly to follow up
5. **Update status promptly**: Keep your tracker accurate and useful

---

**Happy Job Hunting! 🎉**

Made with ❤️ for job seekers everywhere.