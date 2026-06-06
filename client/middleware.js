export function middleware(request) {
  const { pathname, searchParams } = request.nextUrl;
  if (pathname !== "/hybridaction/zybTrackerStatisticsAction") return;

  const callback = searchParams.get("__callback__");
  const payload = JSON.stringify({ success: true });

  if (callback) {
    return new Response(`${callback}(${payload});`, {
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "no-store"
      }
    });
  }

  return Response.json({ success: true });
}

export const config = {
  matcher: "/hybridaction/zybTrackerStatisticsAction"
};
