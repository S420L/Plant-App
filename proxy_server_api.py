import asyncio
import aiohttp
import time
from rest_framework.views import APIView
from rest_framework.response import Response

class ToggleLightsView(APIView):

    async def toggle_light(self, ip):
        """Async function to toggle the light."""
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(ip, timeout=3) as response:
                    return {"ip": ip, "status": "success", "response": await response.text()}
            except asyncio.TimeoutError:
                print(f"Request to {ip} timed out.")
                return {"ip": ip, "status": "timeout"}
            except Exception as e:
                print(f"Error while toggling light at {ip}: {e}")
                return {"ip": ip, "status": "error", "error": str(e)}

    async def handle_requests(self, ips):
        """Process multiple IPs concurrently."""
        tasks = [self.toggle_light(ip) for ip in ips]
        return await asyncio.gather(*tasks)

    def post(self, request):
        start_time = time.time()
        data = request.data
        ip = data.get('ip')

        # Run the async function and wait for all results
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        results = loop.run_until_complete(self.handle_requests(ip))
        #for i in results:
        #    print(i)
        print(f"\nREACHED DATA RETURN: {time.time() - start_time} seconds!!\n")

        # Aggregate results and return
        return Response(results)