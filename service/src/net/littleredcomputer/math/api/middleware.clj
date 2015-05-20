(ns net.littleredcomputer.math.api.middleware
  (:require [clojure.tools.logging :as log])
  (:import [com.google.appengine.api.memcache MemcacheServiceFactory AsyncMemcacheService]))

(set! *warn-on-reflection* true)
(def ^AsyncMemcacheService memcache-service (MemcacheServiceFactory/getAsyncMemcacheService))

(defn log-params
  [handler]
  (fn [request]
    (log/info (:uri request) (:params request))
    (handler request)))

(defmacro cached
  "Synchronously probes GAE Memcache for key-form; returns the corresponding value
  if found; otherwise, evaluates value-form and returns it, while requesting an
  asynchronous association of key -> value to be made in the background."
  [key-form value-form]
  `(let [key# ~key-form
         cached-value# (.get (.get memcache-service key#))]
     (if cached-value#
       (do
         (log/info "cache hit")
         cached-value#)
       (do
         (log/info "cache miss")
         (let [data# ~value-form]
           (.put memcache-service key# data#)
           data#)))))