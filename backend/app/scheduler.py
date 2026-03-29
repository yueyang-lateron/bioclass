from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import asyncio
from app.gbif_fetcher import full_sync
from app.database import log_sync_start, log_sync_finish, get_taxon_count


def run_sync():
    """Run the sync in a separate thread since APScheduler runs in background"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        log_id = log_sync_start()
        loop.run_until_complete(full_sync())
        count = get_taxon_count()
        log_sync_finish(log_id, count, "success")
        print(f"Sync completed: {count} records")
    except Exception as e:
        log_sync_finish(log_id, 0, f"error: {str(e)}")
        print(f"Sync failed: {e}")
    finally:
        loop.close()


scheduler = BackgroundScheduler()


def start_scheduler():
    # Run at 3 AM daily
    scheduler.add_job(
        run_sync,
        CronTrigger(hour=3, minute=0),
        id="daily_gbif_sync",
        name="Daily GBIF Taxonomy Sync",
        replace_existing=True
    )
    scheduler.start()
    print("Scheduler started. Next sync at 3:00 AM")


def trigger_manual_sync():
    """Trigger an immediate sync"""
    if scheduler.running:
        # Remove existing job first to allow immediate rerun
        if scheduler.get_job("daily_gbif_sync"):
            scheduler.remove_job("daily_gbif_sync")
        scheduler.add_job(
            run_sync,
            "date",
            id="manual_sync",
            name="Manual GBIF Sync"
        )
    return True
