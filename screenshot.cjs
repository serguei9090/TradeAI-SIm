const puppeteer = require("puppeteer");

(async () => {
	const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
	const page = await browser.newPage();

	// Set viewport for a desktop layout
	await page.setViewport({ width: 1280, height: 800 });

	// Go to main page and wait for content to load
	await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
	await page.screenshot({ path: "main_page.png" });
	console.log("Saved main_page.png");

	// Open Settings Modal
	// Assuming the settings button has a specific class or icon. Let's find it by looking for the Settings icon (lucide-react) or "Settings" text.
	// Using evaluate to click the settings button
	await page.evaluate(() => {
		// The settings button is an IconButton with the Settings icon.
		// It's the only one with Settings icon, or we can look for specific svg.
		const buttons = Array.from(document.querySelectorAll("button"));
		const settingsBtn = buttons.find((b) =>
			b.innerHTML.includes("lucide-settings"),
		);
		if (settingsBtn) settingsBtn.click();
	});

	// Wait for modal animation
	await new Promise((r) => setTimeout(r, 500));
	await page.screenshot({ path: "settings_modal.png" });
	console.log("Saved settings_modal.png");

	// Close Settings Modal
	await page.evaluate(() => {
		const buttons = Array.from(document.querySelectorAll("button"));
		const cancelBtn = buttons.find((b) => b.textContent === "Cancel");
		if (cancelBtn) cancelBtn.click();
	});
	await new Promise((r) => setTimeout(r, 500));

	// Open Chat Sidebar
	// The floating chat button has the MessageCircle icon
	await page.evaluate(() => {
		const buttons = Array.from(document.querySelectorAll("button"));
		// The chat button has a specific class or we find by icon
		const chatBtn = buttons.find(
			(b) =>
				b.innerHTML.includes("lucide-message-circle") &&
				b.classList.contains("fixed"),
		);
		if (chatBtn) chatBtn.click();
	});

	// Wait for sidebar animation
	await new Promise((r) => setTimeout(r, 500));
	await page.screenshot({ path: "chat_sidebar.png" });
	console.log("Saved chat_sidebar.png");

	await browser.close();
})();
