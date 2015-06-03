package net.littleredcomputer.math.api;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

public class HowdyServlet extends HttpServlet {
  @Override public void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
    resp.setContentType("text/plain; charset=utf-8");
    resp.getWriter().println("hello from java, Colin!");
  }
}