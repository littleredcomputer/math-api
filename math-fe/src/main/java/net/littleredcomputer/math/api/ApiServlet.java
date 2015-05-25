package net.littleredcomputer.math.api;

import com.google.appengine.api.modules.ModulesService;
import com.google.appengine.api.modules.ModulesServiceFactory;
import com.google.appengine.api.urlfetch.*;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URL;
import java.util.List;
import java.util.logging.Logger;

public class ApiServlet extends HttpServlet {
    /** This class just exists to bounce requests starting with the /api prefix to the
     * API module using URLFetch.
     *
     * Normally, dispatch.xml would take care of this, but not in the development
     * appserver. Our dispatch requirements are not complex so we take care of this here.
     * This should not ever occur in production if dispatch.xml is configured correctly.
     */
    private static final Logger log = Logger.getLogger(ApiServlet.class.getName());
    private static final URLFetchService urlFetchService = URLFetchServiceFactory.getURLFetchService();
    private static final ModulesService modulesService = ModulesServiceFactory.getModulesService();
    private static final String apiHostname = modulesService.getVersionHostname("api", null);
    private static final FetchOptions fetchOptions = FetchOptions.Builder.withDeadline(60.0);

    public void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        log.info("delegating API request " + req.getRequestURL() + " to API module at " + apiHostname);
        URL url = new URL("http://" + apiHostname + req.getRequestURI() + "?" + req.getQueryString());
        HTTPRequest ufRequest = new HTTPRequest(url, HTTPMethod.GET, fetchOptions);
        HTTPResponse ufResponse = urlFetchService.fetch(ufRequest);
        List<HTTPHeader> headers = ufResponse.getHeaders();
        for (HTTPHeader h : headers) {
            resp.setHeader(h.getName(), h.getValue());
        }
        resp.setStatus(ufResponse.getResponseCode());
        resp.getOutputStream().write(ufResponse.getContent());
    }
}

