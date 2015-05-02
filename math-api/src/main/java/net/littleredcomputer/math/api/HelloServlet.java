package net.littleredcomputer.math.api;

import clojure.java.api.Clojure;
import clojure.lang.IFn;

import com.google.common.base.Stopwatch;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

public class HelloServlet extends HttpServlet {
    private static final IFn require = Clojure.var("clojure.core", "require");
    static {
        require.invoke(Clojure.read("math.euclid"));
        require.invoke(Clojure.read("math.start"));
        require.invoke(Clojure.read("math.examples.figure-1-7"));
    }
    private static final IFn euc = Clojure.var("math.euclid", "extended-euclid");
    private static final Object zz3 = require.invoke(Clojure.read("net.littleredcomputer.math.api.foo"));
    private static final IFn bar = Clojure.var("net.littleredcomputer.math.api.foo", "bar");
    private static final IFn ex = Clojure.var("math.examples.figure-1-7", "evolve-pendulum");

    @Override public void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {

        resp.setContentType("text/plain; charset=utf-8");
        resp.getWriter().println("hello from java, Colin!");
        resp.getWriter().println("bar = " + bar.invoke(3,4));
        Stopwatch sw = Stopwatch.createStarted();
        resp.getWriter().println(euc.invoke(81, 15));
        sw.stop();
        resp.getWriter().println("that took " + sw);
        sw.reset();
        sw.start();
        resp.getWriter().println(ex.invoke());
        sw.stop();
        resp.getWriter().println("that took " + sw);
    }
}
