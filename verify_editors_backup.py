
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        try:
            print("Navigating to page...")
            await page.goto("http://localhost:8000/", timeout=60000)
            print("Waiting for network idle...")
            await page.wait_for_load_state("networkidle")
            print("Taking screenshot...")
            await page.screenshot(path="/home/jules/verification/initial_page_load.png")
            print("Screenshot taken.")

            # Check if the #tools element is visible
            is_visible = await page.is_visible("#tools")
            print(f"Tools element visible: {is_visible}")


        except Exception as e:
            print("An error occurred: " + str(e))
            await page.screenshot(path="/home/jules/verification/error_screenshot.png")

        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
