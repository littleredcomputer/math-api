(ns net.littleredcomputer.math.api.stats)

(defonce ^:private counters (atom {}))

(defn make-counter
  [name]
  (let [counter (atom 0)]
    (swap! counters assoc name counter)
    (fn f
      ([] (f 1))
      ([x] (swap! counter + x)))))

