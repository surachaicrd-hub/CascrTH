import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Set viewport to desktop size
  await page.setViewportSize({ width: 1440, height: 1080 });
  
  console.log("Navigating to http://localhost:8000...");
  try {
    await page.goto('http://localhost:8000/', { waitUntil: 'networkidle', timeout: 15000 });
    // Wait for animations to settle
    await page.waitForTimeout(3000);
    
    const screenshotPath = path.resolve('C:/Users/cr-se/.gemini/antigravity/brain/7f3c82dc-32e9-4e78-8051-fb221934e219/screenshot_current.png');
    console.log(`Taking screenshot and saving to: ${screenshotPath}`);
    await page.screenshot({ path: screenshotPath });
    console.log("Screenshot saved successfully!");
  } catch (error) {
    console.error("Error occurred while capturing screenshot:", error);
  } finally {
    await browser.close();
  }
})();
