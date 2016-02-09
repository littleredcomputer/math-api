(defproject net.littlredcomputer/math-service "0.0.1-SNAPSHOT"
  :description "ya"
  :url "ya"
  :license {}
  :plugins [[lein-ring "0.9.7"]]
  :ring {:handler net.littleredcomputer.math.api.sicm/sicm}
  :dependencies [[org.clojure/clojure "1.7.0"]
                 [org.clojure/tools.logging "0.3.1"]
                 [ring/ring-core "1.3.2"]
                 [ring/ring-servlet "1.3.2"]
                 [ring/ring-defaults "0.1.5"]
                 [ring/ring-json "0.3.1"]
                 [javax.servlet/javax.servlet-api "3.1.0"]
                 [compojure "1.3.4"]
                 [net.littleredcomputer/sicmutils "0.9.2-SNAPSHOT"]
                 [com.google.appengine/appengine-api-1.0-sdk "1.9.27"]]
  :aot [net.littleredcomputer.math.api.sicm
        net.littleredcomputer.math.api.stats-servlet]
  )
