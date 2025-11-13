
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Listen for console events and print them
        page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))

        await page.goto("http://localhost:8080", wait_until="networkidle")

        # Take a screenshot to see the final state
        screenshot_path = "/home/jules/verification/final_state.png"
        await page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
