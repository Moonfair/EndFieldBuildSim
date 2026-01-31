# AGENTS.md - EndFieldBuildSim Development Guide

## Project Overview

**EndFieldBuildSim** is a data collection project for the Endfield game wiki/database. It fetches item catalogs and device/equipment information from the Zonai API and stores it as JSON data for further processing.

**Project Type**: Data scraping and collection  
**Primary Language**: Python (Playwright), Bash (curl)  
**Data Format**: JSON  
**Target API**: https://zonai.skland.com/web/v1/wiki/

---

## Project Structure

```
EndFieldBuildSim/
 ├── AGENTS.md                    # This file (developer guide)
 ├── README.md                    # Main user guide & data collection workflow
 ├── DEPLOYMENT.md                # GitHub Pages deployment guide
 ├── WEB_APP_COMPLETION.md         # Web app completion report
 └── data/
     ├── DATA_SUMMARY.md          # Data collection summary and results ✅
     ├── DEVICE_PRODUCTION_REPORT.md # Device production statistics (Chinese)
     ├── fetch.py                 # Step 1: Catalog collection
     ├── fetch_details_browser.py # Step 2: Detail fetching (primary method)
     ├── fetch_all_details.sh     # Step 2: Detail fetching (backup method)
     ├── extract_synthesis_tables.py # Step 3: Synthesis table extraction
     ├── extract_device_productions.py # Step 4: Device production extraction
     └── web/                      # Web application
```

**Note**: For data collection workflow details, see [README.md](README.md). This guide focuses on development practices, code style, and technical notes.

---

## Development Setup

### Prerequisites
- **Python 3.8+** (for fetch.py)
- **Playwright** library: `pip install playwright`
- **Playwright browsers**: `playwright install chromium`

### Installation
```bash
# Install Python dependencies
pip install playwright

# Install Playwright browsers
playwright install chromium
```

---

## Related Documentation

- **[README.md](README.md)** - Complete data collection workflow and user guide
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - GitHub Pages deployment instructions
- **[WEB_APP_COMPLETION.md](WEB_APP_COMPLETION.md)** - Web app implementation report
- **[data/DATA_SUMMARY.md](data/DATA_SUMMARY.md)** - Data collection results and file structure
- **[data/DEVICE_PRODUCTION_REPORT.md](data/DEVICE_PRODUCTION_REPORT.md)** - Device production statistics (Chinese)

---

## Code Style Guidelines

### Python Conventions

**Imports**:
- Standard library imports first, then third-party imports
- Use `from X import Y` for specific imports
```python
import json
from playwright.sync_api import sync_playwright
```

**Naming**:
- Variables: `snake_case` (e.g., `item_id`, `browser`, `responses`)
- Functions: `snake_case` (e.g., `fetch_item_info`, `handle_response`)
- Parameters: `snake_case` with type hints

**Type Annotations**:
- Always add type hints to function parameters
- Return type hints are optional but recommended for complex functions
```python
def fetch_item_info(item_id: int) -> dict:
    ...
```

**Error Handling**:
- Use context managers (`with` statements) for resource management
- Add explicit cleanup calls (e.g., `browser.close()`)
- Add try/except blocks for operations that may fail
```python
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    try:
        # operations
    finally:
        browser.close()
```

**Comments**:
- Chinese inline comments are acceptable (project language)
- Place comments above the code they describe
- English comments preferred for public APIs or exported functions
```python
# 访问页面让浏览器处理签名
page.goto(f'https://wiki.skland.com/item/{item_id}')
```

**Entry Points**:
- Always use `if __name__ == '__main__':` pattern for executable scripts
```python
if __name__ == '__main__':
    fetch_via_api_intercept()
```

### Bash/Shell Conventions

**Comments**:
- Descriptive comments above curl commands
- Explain what endpoint is being fetched
```bash
# Fetch Zonai item catalog data
curl 'https://zonai.skland.com/web/v1/wiki/item/catalog?...' \
```

**Formatting**:
- One header per line with backslash continuation
- Keep URLs on separate lines for readability

---

## Data Structure Notes

### API Response Format
All Zonai API responses follow this structure:
```json
{
  "code": 0,
  "message": "OK",
  "timestamp": "...",
  "data": { ... }
}
```

### Authentication

**Automated (Playwright method)**:
- Browser automatically handles all authentication
- Token refresh handled transparently
- First request: 401 → auto-retry → 200
- No manual intervention needed

**Manual (Bash script backup)**:
- API requires signed requests per-request
- Headers needed: `timestamp`, `sign`, `dId`, `vName`, `platform`
- Signatures expire in 30-60 seconds
- Must regenerate from browser DevTools for each run

---

## Testing Guidelines

**Current State**: No test suite exists.

**Future Testing**:
When adding tests, use pytest:

```bash
# Install pytest
pip install pytest

# Run all tests
pytest

# Run specific test file
pytest tests/test_fetch.py

# Run single test
pytest tests/test_fetch.py::test_fetch_item_info
```

**Test Structure**:
```
tests/
├── __init__.py
├── test_fetch.py           # Test data fetching functions
└── fixtures/
    └── sample_response.json
```

---

## Build and Lint Commands

**Current State**: No build system or linters configured.

**Recommended Future Setup**:

### Python Formatting and Linting
```bash
# Install tools
pip install black flake8 mypy

# Format code
black data/

# Lint code
flake8 data/

# Type check
mypy data/
```

### Create requirements.txt
```bash
pip freeze > requirements.txt
```

---

## Common Tasks

### Adding a New API Endpoint

1. Find the endpoint in browser dev tools (Network tab)
2. Copy the curl command or API details
3. Create a new function in `fetch.py` following existing patterns

### Processing Collected Data

**Creating new processors**:
```python
# data/process_items.py
import json

def load_items():
    with open('data/type5_devices.json', 'r') as f:
        devices = json.load(f)
    with open('data/type6_items.json', 'r') as f:
        items = json.load(f)
    return devices + items

if __name__ == '__main__':
    all_items = load_items()
    # process items...
```

### Extending the Project

When adding new features:
1. Create appropriate directory structure (e.g., `src/`, `tests/`)
2. Add `pyproject.toml` or `requirements.txt` for dependencies
3. Add `.gitignore` if creating a git repository
4. Follow existing code style conventions

---

## Important Notes for AI Agents

1. **No Version Control**: This is a git repository. See [DEPLOYMENT.md](DEPLOYMENT.md) for workflow.
2. **No Build System**: No Makefile, npm, or setuptools in Python scripts. Web app has npm (see [web/README.md](web/README.md)).
3. **Data Collection Complete**: All 254 items collected and processed. Re-run scripts only if data needs updating.
4. **Chinese Content**: Data and some comments are in Chinese. This is intentional.
5. **Minimal Project**: Five main source files (fetch.py, fetch_details_browser.py, fetch_all_details.sh, extract_synthesis_tables.py, extract_device_productions.py). Don't over-engineer.
6. **Playwright Success**: fetch_details_browser.py is the PRIMARY method with 100% success rate. Manual bash script is backup only.
7. **Related Documentation**: See [README.md](README.md) for data collection workflow, [data/DATA_SUMMARY.md](data/DATA_SUMMARY.md) for statistics, and [DEPLOYMENT.md](DEPLOYMENT.md) for deployment.

---

## Troubleshooting

**Playwright errors**: Run `playwright install chromium` to install browser binaries  
**API authentication failures**: Regenerate headers from browser dev tools  
**JSON decode errors**: Check if API response format has changed  
**Import errors**: Ensure all dependencies installed with `pip install playwright`

---

**Last Updated**: 2026-01-30  
**Version**: 1.3.0
