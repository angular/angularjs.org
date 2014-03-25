<html>
  <head>
    <title>Update site from: GitHub master</title>
  </head>
<body>
<?php `echo ================================== >> gitFetchSite.log`; ?>
<?php `date >> gitFetchSite.log`; ?>
  <pre><?php echo `date`; ?></pre>
  <pre><?php echo `git fetch origin`; ?></pre>
  <pre><?php echo `git checkout origin/dist -f`; ?></pre>
  <pre><?php echo `git status`; ?></pre>
  <pre><?php echo `git log -n1`; ?></pre>

  <!--
    Cluster-friendly propagation.
    Works with existing Git hooks.
    The request from the git hook will not
    contain the doNotPropagate parameter,
    which will cause this PHP script to call
    a node script that will tell other instances
    to update themselves, but not to propagate the
    change to other instances.
  -->

  <pre><?php if($_GET['doNotPropagate'] != 'true') {
    echo 'Propagating to other intances';
    echo `node propagateClusterUpdate.js`;
  } else {
    echo 'Not Propagating to other instances';
  }
  ?></pre>
  <?php `git log -n1 >> gitFetchSite.log`; ?>
</body>
</html>
