package net.littleredcomputer.math.api;

import clojure.java.api.Clojure;
import clojure.lang.IFn;

import com.google.common.base.Stopwatch;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

public class HelloServlet extends HttpServlet {

  @Override public void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
    final IFn plus = Clojure.var("clojure.core", "+");

    resp.setContentType("text/plain; charset=utf-8");
    resp.getWriter().println("hello from java, Colin!");
    Stopwatch sw = Stopwatch.createStarted();
    resp.getWriter().println(plus.invoke(81, 15));
    sw.stop();
    resp.getWriter().println("that took " + sw);
    sw.reset();
  }
}
