"""
Job scrapers for Naukri and LinkedIn.
Uses Playwright in headless mode with human-like delays.

Install:  pip install playwright && playwright install chromium
"""

import asyncio
import random
import logging
from dataclasses import dataclass, field
from typing import Optional
from playwright.async_api import async_playwright, Page

logger = logging.getLogger(__name__)


@dataclass
class ScrapedJob:
    title:      str
    company:    str
    location:   str
    url:        str
    description: str
    platform:   str
    easy_apply: bool = False


async def _human_delay(min_ms: int = 800, max_ms: int = 2200):
    """Random delay to mimic human browsing."""
    await asyncio.sleep(random.uniform(min_ms / 1000, max_ms / 1000))


# ── Naukri Scraper ─────────────────────────────────────────────────────────────

async def scrape_naukri(
    role: str,
    location: str = "",
    max_jobs: int = 20,
    experience: int = 0,
) -> list[ScrapedJob]:
    """
    Scrape job listings from Naukri.com for a given role and location.
    Returns a list of ScrapedJob objects.
    """
    jobs: list[ScrapedJob] = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1366, "height": 768},
        )
        page = await context.new_page()

        # Build search URL
        role_slug     = role.replace(" ", "-").lower()
        location_slug = location.replace(" ", "-").lower() if location else ""
        search_url    = (
            f"https://www.naukri.com/{role_slug}-jobs"
            + (f"-in-{location_slug}" if location_slug else "")
            + f"?experience={experience}"
        )

        logger.info(f"[Naukri] Fetching: {search_url}")
        await page.goto(search_url, wait_until="domcontentloaded", timeout=30_000)
        await _human_delay()

        # Wait for job cards
        try:
            await page.wait_for_selector("article.jobTuple", timeout=10_000)
        except Exception:
            logger.warning("[Naukri] Job cards not found — page structure may have changed.")
            await browser.close()
            return jobs

        # Collect job card links
        cards = await page.query_selector_all("article.jobTuple")
        links: list[str] = []
        for card in cards[:max_jobs]:
            a = await card.query_selector("a.title")
            if a:
                href = await a.get_attribute("href")
                if href:
                    links.append(href if href.startswith("http") else f"https://www.naukri.com{href}")

        # Visit each job page for full details
        for url in links:
            try:
                job = await _scrape_naukri_job_page(page, url)
                if job:
                    jobs.append(job)
                await _human_delay(1000, 2500)
            except Exception as e:
                logger.error(f"[Naukri] Failed to scrape {url}: {e}")

        await browser.close()

    logger.info(f"[Naukri] Scraped {len(jobs)} jobs for '{role}'")
    return jobs


async def _scrape_naukri_job_page(page: Page, url: str) -> Optional[ScrapedJob]:
    await page.goto(url, wait_until="domcontentloaded", timeout=20_000)
    await _human_delay(600, 1200)

    async def text(selector: str) -> str:
        el = await page.query_selector(selector)
        return (await el.inner_text()).strip() if el else ""

    title       = await text("h1.jd-header-title")
    company     = await text("a.jd-header-comp-name")
    location    = await text("span.location span")
    description = await text("div.job-desc")

    if not title or not company:
        return None

    return ScrapedJob(
        title=title,
        company=company,
        location=location,
        url=url,
        description=description[:3000],  # cap at 3k chars
        platform="naukri",
        easy_apply=False,
    )


# ── LinkedIn Scraper ───────────────────────────────────────────────────────────

async def scrape_linkedin(
    role: str,
    location: str = "India",
    max_jobs: int = 20,
) -> list[ScrapedJob]:
    """
    Scrape public LinkedIn job listings (no login required for basic listings).
    Easy Apply jobs are flagged — these can be auto-submitted.
    """
    jobs: list[ScrapedJob] = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1440, "height": 900},
        )
        page = await context.new_page()

        keywords = role.replace(" ", "%20")
        loc      = location.replace(" ", "%20")
        url      = (
            f"https://www.linkedin.com/jobs/search/"
            f"?keywords={keywords}&location={loc}&f_LF=f_AL"  # f_AL = Easy Apply filter
        )

        logger.info(f"[LinkedIn] Fetching: {url}")
        await page.goto(url, wait_until="domcontentloaded", timeout=30_000)
        await _human_delay(1500, 3000)

        # Scroll to load more cards
        for _ in range(3):
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await _human_delay(800, 1500)

        # Collect job cards
        cards = await page.query_selector_all("div.base-card")
        seen_urls: set[str] = set()

        for card in cards[:max_jobs]:
            try:
                a = await card.query_selector("a.base-card__full-link")
                if not a:
                    continue
                href = await a.get_attribute("href")
                if not href or href in seen_urls:
                    continue
                seen_urls.add(href)

                title_el   = await card.query_selector("h3.base-search-card__title")
                company_el = await card.query_selector("h4.base-search-card__subtitle")
                loc_el     = await card.query_selector("span.job-search-card__location")

                title   = (await title_el.inner_text()).strip()   if title_el   else ""
                company = (await company_el.inner_text()).strip()  if company_el else ""
                loc_txt = (await loc_el.inner_text()).strip()      if loc_el     else ""

                # Fetch job description from detail page
                description, easy_apply = await _scrape_linkedin_job_detail(page, href)

                jobs.append(ScrapedJob(
                    title=title,
                    company=company,
                    location=loc_txt,
                    url=href,
                    description=description,
                    platform="linkedin",
                    easy_apply=easy_apply,
                ))
                await _human_delay(1200, 2800)

            except Exception as e:
                logger.error(f"[LinkedIn] Card error: {e}")

        await browser.close()

    logger.info(f"[LinkedIn] Scraped {len(jobs)} jobs for '{role}'")
    return jobs


async def _scrape_linkedin_job_detail(page: Page, url: str) -> tuple[str, bool]:
    """Returns (description, is_easy_apply)."""
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=20_000)
        await _human_delay(800, 1500)

        desc_el = await page.query_selector("div.description__text")
        desc    = (await desc_el.inner_text()).strip()[:3000] if desc_el else ""

        # Check for Easy Apply button
        easy_apply_btn = await page.query_selector(
            "button.jobs-apply-button span:text('Easy Apply')"
        )
        easy_apply = easy_apply_btn is not None

        return desc, easy_apply
    except Exception:
        return "", False


# ── Unified scrape entry point ─────────────────────────────────────────────────

async def scrape_all_platforms(
    role: str,
    location: str = "India",
    max_per_platform: int = 15,
    experience: int = 0,
) -> list[ScrapedJob]:
    """Run both scrapers concurrently and merge results."""
    naukri_task  = scrape_naukri(role, location, max_per_platform, experience)
    linkedin_task = scrape_linkedin(role, location, max_per_platform)

    results = await asyncio.gather(naukri_task, linkedin_task, return_exceptions=True)

    all_jobs: list[ScrapedJob] = []
    for result in results:
        if isinstance(result, list):
            all_jobs.extend(result)
        else:
            logger.error(f"Scraper error: {result}")

    return all_jobs
